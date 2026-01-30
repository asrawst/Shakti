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
    "transformer_input_data": {
        "kaggle_id": "yajatmalik/transformer-input-output",
        "file": "transformer_input_data.csv",
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
        "transformer_input_data": load_kaggle_dataset("transformer_input_data"),
    }

# ------------------------------------------------------------------
# 3. CORE TRANSFORMER LOSS LOGIC (PURE)
# ------------------------------------------------------------------

def run_transformer_loss_localization(
    smart_meter_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
    transformer_input_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Computes transformer-level loss localization.
    """

    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    if not {"consumer_id", "transformer_id"}.issubset(consumer_transformer_df.columns):
        raise ValueError("consumer_transformer_mapping missing required columns")

    if not {"transformer_id", "date", "energy_input"}.issubset(transformer_input_df.columns):
        raise ValueError("transformer_input_data missing required columns")

    consumer_energy = (
        smart_meter_df
        .merge(consumer_transformer_df, on="consumer_id", how="inner")
        .groupby("transformer_id", as_index=False)
        .agg(
            total_consumer_energy=("energy_consumed", "sum")
        )
    )

    transformer_energy = (
        transformer_input_df
        .groupby("transformer_id", as_index=False)
        .agg(
            total_input_energy=("energy_input", "sum")
        )
    )

    transformer_loss_output = consumer_energy.merge(
        transformer_energy,
        on="transformer_id",
        how="left"
    )

    transformer_loss_output["absolute_loss"] = (
        transformer_loss_output["total_input_energy"] -
        transformer_loss_output["total_consumer_energy"]
    ).clip(lower=0)

    transformer_loss_output["loss_ratio"] = (
        transformer_loss_output["absolute_loss"] /
        transformer_loss_output["total_input_energy"]
    ).fillna(0)

    max_loss = transformer_loss_output["loss_ratio"].max()
    transformer_loss_output["transformer_loss_score"] = (
        transformer_loss_output["loss_ratio"] / max_loss
        if max_loss > 0 else 0
    )

    return transformer_loss_output[
        [
            "transformer_id",
            "total_input_energy",
            "total_consumer_energy",
            "absolute_loss",
            "loss_ratio",
            "transformer_loss_score",
        ]
    ]

# ------------------------------------------------------------------
# 4. PUBLIC ENTRY POINT (BACKEND-SAFE)
# ------------------------------------------------------------------

def run_pipeline(*, user_data: dict) -> pd.DataFrame:
    """
    Backend-safe transformer loss localization.
    User data is mandatory.
    """

    if user_data is None:
        raise ValueError("user_data is required")

    required_keys = {
        "smart_meter_data",
        "consumer_transformer_mapping",
        "transformer_input_data",
    }

    missing = required_keys - set(user_data.keys())
    if missing:
        raise ValueError(f"Missing required user inputs: {missing}")

    return run_transformer_loss_localization(
        smart_meter_df=user_data["smart_meter_data"],
        consumer_transformer_df=user_data["consumer_transformer_mapping"],
        transformer_input_df=user_data["transformer_input_data"],
    )

# ------------------------------------------------------------------
# 5. CLI SANITY CHECK (EXPLICIT SAMPLE MODE)
# ------------------------------------------------------------------

if __name__ == "__main__":
    sample = load_sample_data()
    df = run_transformer_loss_localization(
        smart_meter_df=sample["smart_meter_data"],
        consumer_transformer_df=sample["consumer_transformer_mapping"],
        transformer_input_df=sample["transformer_input_data"],
    )
    print(df.head())
