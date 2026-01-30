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
    "context_data": {
        "kaggle_id": "yajatmalik/contextual-output",
        "file": "context_data.csv",
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
        "context_data": load_kaggle_dataset("context_data"),
    }

# ------------------------------------------------------------------
# 3. Core contextual / seasonal EE logic (NOTEBOOK-FAITHFUL)
# ------------------------------------------------------------------

def run_contextual_seasonal_analysis(
    smart_meter_df: pd.DataFrame,
    context_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Computes contextual-seasonal electricity consumption risk per consumer.
    """

    # ------------------------------
    # Required columns validation
    # ------------------------------
    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    if not {"date", "season", "temperature"}.issubset(context_df.columns):
        raise ValueError("context_data missing required columns")

    # ------------------------------
    # Prepare data
    # ------------------------------
    sm = smart_meter_df.copy()
    ctx = context_df.copy()

    sm["date"] = pd.to_datetime(sm["date"])
    ctx["date"] = pd.to_datetime(ctx["date"])

    # ------------------------------
    # Merge smart meter with context
    # ------------------------------
    merged = sm.merge(
        ctx,
        on="date",
        how="inner"
    )

    # ------------------------------
    # Seasonal baseline (same logic as notebook)
    # ------------------------------
    seasonal_mean = (
        merged
        .groupby("season")["energy_consumed"]
        .transform("mean")
    )

    merged["seasonal_deviation"] = (
        merged["energy_consumed"] - seasonal_mean
    ).abs()

    # ------------------------------
    # Aggregate per consumer
    # ------------------------------
    consumer_agg = (
        merged
        .groupby("consumer_id", as_index=False)
        .agg(
            contextual_score=("seasonal_deviation", "mean")
        )
    )

    # ------------------------------
    # Normalize to 0–1
    # ------------------------------
    max_val = consumer_agg["contextual_score"].max()
    consumer_agg["contextual_risk_score"] = (
        consumer_agg["contextual_score"] / max_val
        if max_val > 0 else 0
    )

    contextual_seasonal_output = consumer_agg[
        [
            "consumer_id",
            "contextual_risk_score",
        ]
    ]

    return contextual_seasonal_output

# ------------------------------------------------------------------
# 4. Public entry point (sample vs user data)
# ------------------------------------------------------------------

def run_pipeline(mode="sample", user_data=None):
    """
    mode = "sample" | "user"

    user_data must contain:
    - smart_meter_data
    - context_data
    """

    if mode == "sample":
        data = load_sample_data()
    elif mode == "user":
        if user_data is None:
            raise ValueError("user_data must be provided in user mode")
        data = user_data
    else:
        raise ValueError("mode must be 'sample' or 'user'")

    return run_contextual_seasonal_analysis(
        smart_meter_df=data["smart_meter_data"],
        context_df=data["context_data"],
    )

# ------------------------------------------------------------------
# 5. CLI sanity check
# ------------------------------------------------------------------

if __name__ == "__main__":
    df = run_pipeline(mode="sample")
    print(df.head())
