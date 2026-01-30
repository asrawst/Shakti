import pandas as pd
import numpy as np
import kagglehub
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

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
        "context_data": load_kaggle_dataset("context_data"),
        "consumer_transformer_mapping": load_kaggle_dataset("consumer_transformer_mapping"),
    }

# ------------------------------------------------------------------
# 3. Feature engineering (NOTEBOOK-FAITHFUL)
# ------------------------------------------------------------------

def build_features(
    smart_meter_df: pd.DataFrame,
    context_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Builds per-consumer features for anomaly detection.
    """

    # ------------------------------
    # Required columns validation
    # ------------------------------
    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    if not {"date", "season", "temperature"}.issubset(context_df.columns):
        raise ValueError("context_data missing required columns")

    if not {"consumer_id", "transformer_id"}.issubset(consumer_transformer_df.columns):
        raise ValueError("consumer_transformer_mapping missing required columns")

    sm = smart_meter_df.copy()
    ctx = context_df.copy()

    sm["date"] = pd.to_datetime(sm["date"])
    ctx["date"] = pd.to_datetime(ctx["date"])

    # ------------------------------
    # Merge smart meter + context
    # ------------------------------
    merged = sm.merge(ctx, on="date", how="inner")

    # ------------------------------
    # Attach transformer context
    # ------------------------------
    merged = merged.merge(
        consumer_transformer_df,
        on="consumer_id",
        how="inner"
    )

    merged = merged.sort_values(["consumer_id", "date"])

    # ------------------------------
    # Rolling statistics
    # ------------------------------
    merged["rolling_mean"] = (
        merged.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(7, min_periods=3).mean())
    )

    merged["rolling_std"] = (
        merged.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(7, min_periods=3).std())
        .fillna(0.0)
    )

    merged["deviation"] = (
        merged["energy_consumed"] - merged["rolling_mean"]
    )

    # ------------------------------
    # Aggregate features per consumer
    # ------------------------------
    feature_df = (
        merged
        .dropna()
        .groupby("consumer_id", as_index=False)
        .agg(
            mean_consumption=("energy_consumed", "mean"),
            std_consumption=("energy_consumed", "std"),
            mean_deviation=("deviation", "mean"),
            max_deviation=("deviation", "max"),
            mean_temperature=("temperature", "mean"),
        )
        .fillna(0.0)
    )

    return feature_df

# ------------------------------------------------------------------
# 4. Model training (OFFLINE)
# ------------------------------------------------------------------

def train_model(
    feature_df: pd.DataFrame,
    model_path: str = "anomaly_model.pkl",
):
    X = feature_df.drop(columns=["consumer_id"])

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_scaled)

    joblib.dump(
        {"model": model, "scaler": scaler},
        model_path,
    )

# ------------------------------------------------------------------
# 5. Inference
# ------------------------------------------------------------------

def run_anomaly_inference(
    smart_meter_df: pd.DataFrame,
    context_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
    model_path: str = "anomaly_model.pkl",
) -> pd.DataFrame:

    artifacts = joblib.load(model_path)
    model = artifacts["model"]
    scaler = artifacts["scaler"]

    feature_df = build_features(
        smart_meter_df,
        context_df,
        consumer_transformer_df,
    )

    X = feature_df.drop(columns=["consumer_id"])
    X_scaled = scaler.transform(X)

    raw_scores = -model.decision_function(X_scaled)

    anomaly_detection_output = feature_df[["consumer_id"]].copy()
    anomaly_detection_output["anomaly_risk_score"] = raw_scores

    # Normalize to 0–1
    max_val = anomaly_detection_output["anomaly_risk_score"].max()
    anomaly_detection_output["anomaly_risk_score"] = (
        anomaly_detection_output["anomaly_risk_score"] / max_val
        if max_val > 0 else 0
    )

    return anomaly_detection_output[
        ["consumer_id", "anomaly_risk_score"]
    ]

# ------------------------------------------------------------------
# 6. Public entry point
# ------------------------------------------------------------------

def run_pipeline(
    mode="sample",
    user_data=None,
    model_path="anomaly_model.pkl",
):
    """
    mode = "sample" | "user"

    user_data must contain:
    - smart_meter_data
    - context_data
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

    return run_anomaly_inference(
        smart_meter_df=data["smart_meter_data"],
        context_df=data["context_data"],
        consumer_transformer_df=data["consumer_transformer_mapping"],
        model_path=model_path,
    )

# ------------------------------------------------------------------
# 7. CLI hook
# ------------------------------------------------------------------

if __name__ == "__main__":
    sample = load_sample_data()
    features = build_features(
        sample["smart_meter_data"],
        sample["context_data"],
        sample["consumer_transformer_mapping"],
    )
    train_model(features)

    df = run_pipeline(mode="sample")
    print(df.head())
