import pandas as pd
import kagglehub
from pathlib import Path

# ------------------------------------------------------------------
# 1. SAMPLE DATA REGISTRY (CLI / RESEARCH ONLY)
# ------------------------------------------------------------------

DATASETS = {
    "smart_meter_data": {
        "kaggle_id": "yajatmalik/smart-meter-output",
        "file": "smart_meter_data.csv",
    }
}

# ------------------------------------------------------------------
# 2. SAMPLE LOADER (NOT USED BY BACKEND)
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
# 3. CORE SMART-METER ANOMALY LOGIC (PURE)
# ------------------------------------------------------------------

def run_smart_meter_anomaly(
    smart_meter_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Computes smart-meter anomaly risk per consumer.
    """

    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    df = smart_meter_df.copy()
    df["date"] = pd.to_datetime(df["date"], dayfirst=True, format="mixed")
    df = df.sort_values(["consumer_id", "date"])

    df["rolling_mean"] = (
        df.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(window=7, min_periods=3).mean())
    )

    df["rolling_std"] = (
        df.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(window=7, min_periods=3).std())
        .fillna(0.0)
    )

    df["zscore"] = (
        (df["energy_consumed"] - df["rolling_mean"]) /
        (df["rolling_std"] + 1e-6)
    ).abs()

    smart_meter_anomaly_output = (
        df
        .groupby("consumer_id", as_index=False)
        .agg(
            smart_meter_risk_score=("zscore", "mean")
        )
    )

    max_val = smart_meter_anomaly_output["smart_meter_risk_score"].max()
    smart_meter_anomaly_output["smart_meter_risk_score"] = (
        smart_meter_anomaly_output["smart_meter_risk_score"] / max_val
        if max_val > 0 else 0
    )

    return smart_meter_anomaly_output[
        ["consumer_id", "smart_meter_risk_score"]
    ]

# ------------------------------------------------------------------
# 4. PUBLIC ENTRY POINT (BACKEND-SAFE)
# ------------------------------------------------------------------

def run_pipeline(*, user_data: dict) -> pd.DataFrame:
    """
    Backend-safe smart meter anomaly detection.
    User data is mandatory.
    """

    if user_data is None:
        raise ValueError("user_data is required")

    required_keys = {"smart_meter_data"}
    missing = required_keys - set(user_data.keys())
    if missing:
        raise ValueError(f"Missing required user inputs: {missing}")

    return run_smart_meter_anomaly(
        smart_meter_df=user_data["smart_meter_data"]
    )

# ------------------------------------------------------------------
# 5. CLI SANITY CHECK (EXPLICIT SAMPLE MODE)
# ------------------------------------------------------------------

if __name__ == "__main__":
    sample = load_sample_data()
    df = run_smart_meter_anomaly(
        smart_meter_df=sample["smart_meter_data"]
    )
    print(df.head())
