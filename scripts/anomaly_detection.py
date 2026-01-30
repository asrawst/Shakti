import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

# ------------------------------------------------------------------
# 1. FEATURE ENGINEERING (PURE LOGIC)
# ------------------------------------------------------------------

def build_features(
    smart_meter_df: pd.DataFrame,
    context_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Builds per-consumer features for anomaly detection.
    """

    if not {"consumer_id", "date", "energy_consumed"}.issubset(smart_meter_df.columns):
        raise ValueError("smart_meter_data missing required columns")

    if not {"date", "season", "temperature"}.issubset(context_df.columns):
        raise ValueError("context_data missing required columns")

    if not {"consumer_id", "transformer_id"}.issubset(consumer_transformer_df.columns):
        raise ValueError("consumer_transformer_mapping missing required columns")

    sm = smart_meter_df.copy()
    ctx = context_df.copy()

    sm["date"] = pd.to_datetime(sm["date"], dayfirst=True, format="mixed")
    ctx["date"] = pd.to_datetime(ctx["date"], dayfirst=True, format="mixed")

    merged = sm.merge(ctx, on="date", how="inner")
    merged = merged.merge(
        consumer_transformer_df,
        on="consumer_id",
        how="inner"
    )

    merged = merged.sort_values(["consumer_id", "date"])

    merged["rolling_mean"] = (
        merged.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(7, min_periods=3).mean())
    )

    merged["rolling_std"] = (
        merged.groupby("consumer_id")["energy_consumed"]
        .transform(lambda x: x.rolling(7, min_periods=3).std())
        .fillna(0.0)
    )

    merged["deviation"] = merged["energy_consumed"] - merged["rolling_mean"]

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
# 2. MODEL TRAINING (OFFLINE ONLY)
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
# 3. INFERENCE CORE (PURE)
# ------------------------------------------------------------------

def run_anomaly_inference(
    *,
    smart_meter_df: pd.DataFrame,
    context_df: pd.DataFrame,
    consumer_transformer_df: pd.DataFrame,
    model_path: str,
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

    output = feature_df[["consumer_id"]].copy()
    output["anomaly_risk_score"] = raw_scores

    max_val = output["anomaly_risk_score"].max()
    output["anomaly_risk_score"] = (
        output["anomaly_risk_score"] / max_val
        if max_val > 0 else 0
    )

    return output[["consumer_id", "anomaly_risk_score"]]

# ------------------------------------------------------------------
# 4. PUBLIC ENTRY POINT (BACKEND-SAFE)
# ------------------------------------------------------------------

def run_pipeline(*, user_data: dict, model_path: str) -> pd.DataFrame:
    """
    Backend-safe anomaly detection entry point.
    User data is mandatory.
    """

    if user_data is None:
        raise ValueError("user_data is required")

    required_keys = {
        "smart_meter_data",
        "context_data",
        "consumer_transformer_mapping",
    }

    missing = required_keys - set(user_data.keys())
    if missing:
        raise ValueError(f"Missing required user inputs: {missing}")

    return run_anomaly_inference(
        smart_meter_df=user_data["smart_meter_data"],
        context_df=user_data["context_data"],
        consumer_transformer_df=user_data["consumer_transformer_mapping"],
        model_path=model_path,
    )
