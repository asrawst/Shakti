import pandas as pd
import kagglehub
from pathlib import Path

# ------------------------------------------------------------------
# 1. Dataset registry (sample Kaggle data only)
# ------------------------------------------------------------------

DATASETS = {
    "voltage_pq_data": {
        "kaggle_id": "yajatmalik/voltage-output",
        "file": "voltage_pq_data.csv",
    },
    "consumer_transformer_mapping": {
        "kaggle_id": "yajatmalik/loss-localization",
        "file": "consumer_transformer_mapping.csv",
    },
}

# ------------------------------------------------------------------
# 2. Kaggle loader (sample mode)
# ------------------------------------------------------------------

def load_kaggle_dataset(name: str) -> pd.DataFrame:
    meta = DATASETS[name]
    path = kagglehub.dataset_download(meta["kaggle_id"], cache=True)
    return pd.read_csv(Path(path) / meta["file"])


def load_sample_data():
    return {
        "voltage_pq_data": load_kaggle_dataset("voltage_pq_data"),
        "consumer_transformer_mapping": load_kaggle_dataset("consumer_transformer_mapping"),
    }

# ------------------------------------------------------------------
# 3. Core voltage spike / PQ abnormality logic (NOTEBOOK-FAITHFUL)
# ------------------------------------------------------------------

def run_voltage_spike_abnormality(
    voltage_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
    nominal_voltage: float = 230.0,
    tolerance_pct: float = 0.10,
) -> pd.DataFrame:
    """
    Computes voltage abnormality risk per consumer.
    """

    # ------------------------------
    # Required columns validation
    # ------------------------------
    # ------------------------------
    # Soft Validation & Auto-Fill
    # ------------------------------
    required_cols = {"consumer_id", "date", "avg_voltage", "voltage_variance"}
    missing = required_cols - set(voltage_df.columns)
    
    if missing:
        print(f"WARNING: voltage_pq_data missing {missing}. Filling with default.")
        for col in missing:
            if "id" in col:
                voltage_df[col] = "0"
            else:
                voltage_df[col] = 0.0
            
    # For consumer_transformer_mapping, we really need the IDs.
    if "consumer_id" not in consumer_transformer_df.columns or "transformer_id" not in consumer_transformer_df.columns:
        # Failsafe: create mock mapping if totally missing? 
        # For now, let's just warn, but basic IDs are usually present.
        print("WARNING: consumer_transformer_mapping missing ID columns.")

    df = voltage_df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # ------------------------------
    # Attach transformer context (as in notebook)
    # ------------------------------
    df = df.merge(
        consumer_transformer_df,
        on="consumer_id",
        how="inner"
    )

    # ------------------------------
    # Voltage spike detection logic
    # ------------------------------
    lower = nominal_voltage * (1 - tolerance_pct)
    upper = nominal_voltage * (1 + tolerance_pct)

    variance_threshold = df["voltage_variance"].quantile(0.95)

    df["voltage_spike"] = (
        (df["avg_voltage"] < lower) |
        (df["avg_voltage"] > upper) |
        (df["voltage_variance"] > variance_threshold)
    ).astype(int)

    # ------------------------------
    # Aggregate at consumer level
    # ------------------------------
    consumer_agg = (
        df
        .groupby("consumer_id", as_index=False)
        .agg(
            spike_count=("voltage_spike", "sum"),
            total_readings=("voltage_spike", "count"),
        )
    )

    consumer_agg["voltage_risk_score"] = (
        consumer_agg["spike_count"] /
        consumer_agg["total_readings"]
    )

    # ------------------------------
    # Normalize to 0–1
    # ------------------------------
    max_val = consumer_agg["voltage_risk_score"].max()
    consumer_agg["voltage_risk_score"] = (
        consumer_agg["voltage_risk_score"] / max_val
        if max_val > 0 else 0
    )

    voltage_abnormality_output = consumer_agg[
        [
            "consumer_id",
            "voltage_risk_score",
        ]
    ]

    return voltage_abnormality_output

# ------------------------------------------------------------------
# 4. Public entry point (sample vs user data)
# ------------------------------------------------------------------

def run_pipeline(mode="sample", user_data=None):
    """
    mode = "sample" | "user"

    user_data must contain:
    - voltage_pq_data
    - consumer_transformer_mapping
    """

    if mode == "sample":
        data = load_sample_data()
    elif mode == "user":
        if user_data is None:
            raise ValueError("user_data must be provided in user mode")
        data = user_data
    else:
        raise ValueError("mode must be 'sample' or 'user'")

    return run_voltage_spike_abnormality(
        voltage_df=data["voltage_pq_data"],
        consumer_transformer_df=data["consumer_transformer_mapping"],
    )

# ------------------------------------------------------------------
# 5. CLI sanity check
# ------------------------------------------------------------------

if __name__ == "__main__":
    df = run_pipeline(mode="sample")
    print(df.head())
