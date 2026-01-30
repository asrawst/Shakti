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
    },
    "consumer_transformer_mapping": {
        "kaggle_id": "yajatmalik/loss-localization",
        "file": "consumer_transformer_mapping.csv",
    },
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
        "consumer_transformer_mapping": load_kaggle_dataset("consumer_transformer_mapping"),
    }

# ------------------------------------------------------------------
# 3. CORE PEER-COMPARISON LOGIC (PURE)
# ------------------------------------------------------------------

def run_peer_comparison(
    smart_meter_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Computes peer-comparison risk score per consumer.
    """

    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    if not {"consumer_id", "transformer_id"}.issubset(consumer_transformer_df.columns):
        raise ValueError("consumer_transformer_mapping missing required columns")

    df = smart_meter_df.merge(
        consumer_transformer_df,
        on="consumer_id",
        how="inner"
    )

    consumer_consumption = (
        df
        .groupby("consumer_id", as_index=False)
        .agg(
            mean_consumption=("energy_consumed", "mean")
        )
    )

    peer_mean = consumer_consumption["mean_consumption"].mean()
    peer_std = consumer_consumption["mean_consumption"].std()

    consumer_consumption["peer_zscore"] = (
        (consumer_consumption["mean_consumption"] - peer_mean) /
        (peer_std + 1e-6)
    ).abs()

    max_val = consumer_consumption["peer_zscore"].max()
    consumer_consumption["peer_risk_score"] = (
        consumer_consumption["peer_zscore"] / max_val
        if max_val > 0 else 0
    )

    return consumer_consumption[
        ["consumer_id", "peer_risk_score"]
    ]

# ------------------------------------------------------------------
# 4. PUBLIC ENTRY POINT (BACKEND-SAFE)
# ------------------------------------------------------------------

def run_pipeline(*, user_data: dict) -> pd.DataFrame:
    """
    Backend-safe peer comparison.
    User data is mandatory.
    """

    if user_data is None:
        raise ValueError("user_data is required")

    required_keys = {
        "smart_meter_data",
        "consumer_transformer_mapping",
    }

    missing = required_keys - set(user_data.keys())
    if missing:
        raise ValueError(f"Missing required user inputs: {missing}")

    return run_peer_comparison(
        smart_meter_df=user_data["smart_meter_data"],
        consumer_transformer_df=user_data["consumer_transformer_mapping"],
    )

# ------------------------------------------------------------------
# 5. CLI SANITY CHECK (EXPLICIT SAMPLE MODE)
# ------------------------------------------------------------------

if __name__ == "__main__":
    sample = load_sample_data()
    df = run_peer_comparison(
        smart_meter_df=sample["smart_meter_data"],
        consumer_transformer_df=sample["consumer_transformer_mapping"],
    )
    print(df.head())
