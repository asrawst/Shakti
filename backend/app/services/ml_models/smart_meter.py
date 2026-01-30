import pandas as pd
import kagglehub
from pathlib import Path

# ------------------------------------------------------------------
# 1. Dataset registry (sample Kaggle data only)
# ------------------------------------------------------------------

DATASETS = {
    "smart_meter_data": {
        "kaggle_id": "yajatmalik/smart-meter-output",
        "file": "smart_meter_data.csv",
    }
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
        "smart_meter_data": load_kaggle_dataset("smart_meter_data"),
    }

# ------------------------------------------------------------------
# 3. Core smart-meter anomaly logic (NOTEBOOK-FAITHFUL)
# ------------------------------------------------------------------

def run_smart_meter_anomaly(
    smart_meter_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Computes smart-meter anomaly risk per consumer.
    """

    # ------------------------------
    # Required columns validation
    # ------------------------------
    # ------------------------------
    # Soft Validation
    # ------------------------------
    required_cols = {"consumer_id", "date", "energy_consumed"}
    missing = required_cols - set(smart_meter_df.columns)
    if missing:
        print(f"WARNING: smart_meter_data missing {missing}. Filling with default.")
        for col in missing:
            if "id" in col:
                smart_meter_df[col] = "0"
            else:
                smart_meter_df[col] = 0.0

    df = smart_meter_df.copy()

    # ------------------------------
    # Time ordering (same as notebook)
    # ------------------------------
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["consumer_id", "date"])

    # ------------------------------
    # Rolling statistics
    # ------------------------------
    df["rolling_mean"] = (
        df.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(window=7, min_periods=3).mean())
    )

    df["rolling_std"] = (
        df.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(window=7, min_periods=3).std())
        .fillna(0.0)
    )

    # ------------------------------
    # Z-score anomaly
    # ------------------------------
    df["zscore"] = (
        (df["energy_consumed"] - df["rolling_mean"]) /
        (df["rolling_std"] + 1e-6)
    ).abs()

    # ------------------------------
    # Aggregate per consumer
    # ------------------------------
    smart_meter_anomaly_output = (
        df
        .groupby("consumer_id", as_index=False)
        .agg(
            smart_meter_risk_score=("zscore", "mean")
        )
    )

    # ------------------------------
    # Normalize to 0–1
    # ------------------------------
    max_val = smart_meter_anomaly_output["smart_meter_risk_score"].max()
    smart_meter_anomaly_output["smart_meter_risk_score"] = (
        smart_meter_anomaly_output["smart_meter_risk_score"] / max_val
        if max_val > 0 else 0
    )

    return smart_meter_anomaly_output[
        [
            "consumer_id",
            "smart_meter_risk_score",
        ]
    ]

# ------------------------------------------------------------------
# 4. Public entry point (sample vs user data)
# ------------------------------------------------------------------

def run_pipeline(mode="sample", user_data=None):
    """
    mode = "sample" | "user"

    user_data must contain:
    - smart_meter_data
    """

    if mode == "sample":
        data = load_sample_data()
    elif mode == "user":
        if user_data is None:
            raise ValueError("user_data must be provided in user mode")
        data = user_data
    else:
        raise ValueError("mode must be 'sample' or 'user'")

    return run_smart_meter_anomaly(
        smart_meter_df=data["smart_meter_data"]
    )

# ------------------------------------------------------------------
# 5. CLI sanity check
# ------------------------------------------------------------------

if __name__ == "__main__":
    df = run_pipeline(mode="sample")
    print(df.head())
