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
    "context_data": {
        "kaggle_id": "yajatmalik/contextual-output",
        "file": "context_data.csv",
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
        "context_data": load_kaggle_dataset("context_data"),
    }

# ------------------------------------------------------------------
# 3. CORE CONTEXTUAL / SEASONAL LOGIC (PURE)
# ------------------------------------------------------------------

def run_contextual_seasonal_analysis(
    smart_meter_df: pd.DataFrame,
    context_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Computes contextual-seasonal electricity consumption risk per consumer.
    """

    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    if not {"date", "season", "temperature"}.issubset(context_df.columns):
        raise ValueError("context_data missing required columns")

    sm = smart_meter_df.copy()
    ctx = context_df.copy()

    sm["date"] = pd.to_datetime(sm["date"], dayfirst=True, format="mixed")
    ctx["date"] = pd.to_datetime(ctx["date"], dayfirst=True, format="mixed")

    merged = sm.merge(
        ctx,
        on="date",
        how="inner"
    )

    seasonal_mean = (
        merged
        .groupby("season")["energy_consumed"]
        .transform("mean")
    )

    merged["seasonal_deviation"] = (
        merged["energy_consumed"] - seasonal_mean
    ).abs()

    consumer_agg = (
        merged
        .groupby("consumer_id", as_index=False)
        .agg(
            contextual_score=("seasonal_deviation", "mean")
        )
    )

    max_val = consumer_agg["contextual_score"].max()
    consumer_agg["contextual_risk_score"] = (
        consumer_agg["contextual_score"] / max_val
        if max_val > 0 else 0
    )

    return consumer_agg[
        [
            "consumer_id",
            "contextual_risk_score",
        ]
    ]

# ------------------------------------------------------------------
# 4. PUBLIC ENTRY POINT (BACKEND-SAFE)
# ------------------------------------------------------------------

def run_pipeline(*, user_data: dict) -> pd.DataFrame:
    """
    Backend-safe contextual / seasonal analysis.
    User data is mandatory.
    """

    if user_data is None:
        raise ValueError("user_data is required")

    required_keys = {
        "smart_meter_data",
        "context_data",
    }

    missing = required_keys - set(user_data.keys())
    if missing:
        raise ValueError(f"Missing required user inputs: {missing}")

    return run_contextual_seasonal_analysis(
        smart_meter_df=user_data["smart_meter_data"],
        context_df=user_data["context_data"],
    )

# ------------------------------------------------------------------
# 5. CLI SANITY CHECK (EXPLICIT SAMPLE MODE)
# ------------------------------------------------------------------

if __name__ == "__main__":
    sample = load_sample_data()
    df = run_contextual_seasonal_analysis(
        smart_meter_df=sample["smart_meter_data"],
        context_df=sample["context_data"],
    )
    print(df.head())
