import pandas as pd
import kagglehub
from pathlib import Path

# ------------------------------------------------------------------
# 1. Dataset registry (SAMPLE ONLY – NOT USED IN BACKEND)
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
# 2. Sample data loader (CLI / research only)
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
# 3. Core voltage spike / PQ abnormality logic
# ------------------------------------------------------------------

def run_voltage_spike_abnormality(
    voltage_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
    nominal_voltage: float = 230.0,
    tolerance_pct: float = 0.10,
) -> pd.DataFrame:

    if not {
        "consumer_id",
        "date",
        "avg_voltage",
        "voltage_variance",
    }.issubset(voltage_df.columns):
        raise ValueError("voltage_pq_data missing required columns")

    if not {"consumer_id", "transformer_id"}.issubset(consumer_transformer_df.columns):
        raise ValueError("consumer_transformer_mapping missing required columns")

    df = voltage_df.copy()
    df["date"] = pd.to_datetime(df["date"], dayfirst=True, format="mixed")

    df = df.merge(
        consumer_transformer_df,
        on="consumer_id",
        how="inner"
    )

    lower = nominal_voltage * (1 - tolerance_pct)
    upper = nominal_voltage * (1 + tolerance_pct)

    variance_threshold = df["voltage_variance"].quantile(0.95)

    df["voltage_spike"] = (
        (df["avg_voltage"] < lower) |
        (df["avg_voltage"] > upper) |
        (df["voltage_variance"] > variance_threshold)
    ).astype(int)

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

    max_val = consumer_agg["voltage_risk_score"].max()
    consumer_agg["voltage_risk_score"] = (
        consumer_agg["voltage_risk_score"] / max_val
        if max_val > 0 else 0
    )

    return consumer_agg[
        ["consumer_id", "voltage_risk_score"]
    ]

# ------------------------------------------------------------------
# 4. PUBLIC ENTRY POINT – USER DATA ONLY
# ------------------------------------------------------------------

def run_pipeline(*, user_data: dict) -> pd.DataFrame:
    """
    User-only entry point (backend-safe).
    """

    if user_data is None:
        raise ValueError("user_data is required")

    required_keys = {
        "voltage_pq_data",
        "consumer_transformer_mapping",
    }

    missing = required_keys - set(user_data.keys())
    if missing:
        raise ValueError(f"Missing required user inputs: {missing}")

    return run_voltage_spike_abnormality(
        voltage_df=user_data["voltage_pq_data"],
        consumer_transformer_df=user_data["consumer_transformer_mapping"],
    )

# ------------------------------------------------------------------
# 5. CLI sanity check (EXPLICIT SAMPLE MODE)
# ------------------------------------------------------------------

if __name__ == "__main__":
    sample = load_sample_data()
    df = run_voltage_spike_abnormality(
        voltage_df=sample["voltage_pq_data"],
        consumer_transformer_df=sample["consumer_transformer_mapping"],
    )
    print(df.head())
