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
        "smart_meter_data": load_kaggle_dataset("smart_meter_data"),
        "consumer_transformer_mapping": load_kaggle_dataset("consumer_transformer_mapping"),
    }

# ------------------------------------------------------------------
# 3. Core peer-comparison logic (NOTEBOOK-FAITHFUL)
# ------------------------------------------------------------------

def run_peer_comparison(
    smart_meter_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Computes peer-comparison risk score per consumer.
    """

    # ------------------------------
    # Required columns validation
    # ------------------------------
    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    if not {"consumer_id", "transformer_id"}.issubset(consumer_transformer_df.columns):
        raise ValueError("consumer_transformer_mapping missing required columns")

    # ------------------------------
    # Merge to attach transformer context
    # ------------------------------
    df = smart_meter_df.merge(
        consumer_transformer_df,
        on="consumer_id",
        how="inner"
    )

    # ------------------------------
    # Aggregate consumption per consumer
    # ------------------------------
    consumer_consumption = (
        df
        .groupby("consumer_id", as_index=False)
        .agg(
            mean_consumption=("energy_consumed", "mean")
        )
    )

    # ------------------------------
    # Peer statistics (global, same as notebook)
    # ------------------------------
    peer_mean = consumer_consumption["mean_consumption"].mean()
    peer_std = consumer_consumption["mean_consumption"].std()

    # ------------------------------
    # Z-score vs peers
    # ------------------------------
    consumer_consumption["peer_zscore"] = (
        (consumer_consumption["mean_consumption"] - peer_mean) /
        (peer_std + 1e-6)
    ).abs()

    # ------------------------------
    # Normalize to 0–1 risk score
    # ------------------------------
    max_val = consumer_consumption["peer_zscore"].max()
    consumer_consumption["peer_risk_score"] = (
        consumer_consumption["peer_zscore"] / max_val
        if max_val > 0 else 0
    )

    peer_comparison_output = consumer_consumption[
        [
            "consumer_id",
            "peer_risk_score",
        ]
    ]

    return peer_comparison_output

# ------------------------------------------------------------------
# 4. Public entry point (sample vs user data)
# ------------------------------------------------------------------

def run_pipeline(mode="sample", user_data=None):
    """
    mode = "sample" | "user"

    user_data must contain:
    - smart_meter_data
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

    return run_peer_comparison(
        smart_meter_df=data["smart_meter_data"],
        consumer_transformer_df=data["consumer_transformer_mapping"],
    )

# ------------------------------------------------------------------
# 5. CLI sanity check
# ------------------------------------------------------------------

if __name__ == "__main__":
    df = run_pipeline(mode="sample")
    print(df.head())
