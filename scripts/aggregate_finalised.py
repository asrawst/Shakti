import pandas as pd

# -------------------------------------------------------------
# Import pipeline entry points (USER-DATA ONLY)
# -------------------------------------------------------------

from contextual_seasonal_ee import run_pipeline as contextual_pipeline
from peer_comparison import run_pipeline as peer_pipeline
from smart_meter import run_pipeline as smart_meter_pipeline
from voltage_spike_abnormality import run_pipeline as voltage_pipeline
from transformer_loss_localization import run_pipeline as transformer_pipeline

# Heavy ML (optional)
from anomaly_detection import run_pipeline as anomaly_ml_pipeline


# -------------------------------------------------------------
# 1. Risk aggregation logic (FIXED WEIGHTS)
# -------------------------------------------------------------

def aggregate_risk_scores(
    consumer_df: pd.DataFrame,
    contextual_df: pd.DataFrame,
    peer_df: pd.DataFrame,
    smart_df: pd.DataFrame,
    voltage_df: pd.DataFrame,
    transformer_df: pd.DataFrame,
    anomaly_df: pd.DataFrame | None = None,
) -> pd.DataFrame:

    df = consumer_df.copy()

    df = (
        df
        .merge(contextual_df, on="consumer_id", how="left")
        .merge(peer_df, on="consumer_id", how="left")
        .merge(smart_df, on="consumer_id", how="left")
        .merge(voltage_df, on="consumer_id", how="left")
        .merge(transformer_df, on="transformer_id", how="left")
    )

    if anomaly_df is not None:
        df = df.merge(anomaly_df, on="consumer_id", how="left")
        df["anomaly_risk_score"] = df["anomaly_risk_score"].fillna(0.0)
    else:
        df["anomaly_risk_score"] = 0.0

    risk_cols = [
        "contextual_risk_score",
        "peer_risk_score",
        "smart_meter_risk_score",
        "voltage_risk_score",
        "transformer_loss_score",
        "anomaly_risk_score",
    ]

    df[risk_cols] = df[risk_cols].fillna(0.0)

    df["aggregate_risk_score"] = (
        0.22 * df["contextual_risk_score"] +
        0.20 * df["peer_risk_score"] +
        0.10 * df["smart_meter_risk_score"] +
        0.15 * df["voltage_risk_score"] +
        0.18 * df["transformer_loss_score"] +
        0.15 * df["anomaly_risk_score"]
    )

    return df


# -------------------------------------------------------------
# 2. Classification logic (QUANTILE-BASED)
# -------------------------------------------------------------

def classify_risk(
    df: pd.DataFrame,
    score_col: str = "aggregate_risk_score"
) -> pd.DataFrame:

    q65 = df[score_col].quantile(0.65)
    q85 = df[score_col].quantile(0.85)
    q99 = df[score_col].quantile(0.99)

    def bucket(score: float) -> str:
        if score >= q99:
            return "critical"
        elif score >= q85:
            return "high"
        elif score >= q65:
            return "mild"
        else:
            return "normal"

    df["risk_class"] = df[score_col].apply(bucket)
    df["inspection_flag"] = df[score_col] >= q99

    return df


# -------------------------------------------------------------
# 3. PUBLIC ORCHESTRATOR (BACKEND-SAFE)
# -------------------------------------------------------------

def run_pipeline(
    *,
    user_data: dict,
    run_anomaly_model: bool = False,
    anomaly_model_path: str = "anomaly_model.pkl",
) -> pd.DataFrame:
    """
    Backend-safe aggregator.
    User data is mandatory.
    """

    if user_data is None:
        raise ValueError("user_data is required")

    required_keys = {
        "smart_meter_data",
        "context_data",
        "consumer_transformer_mapping",
        "voltage_pq_data",
        "transformer_input_data",
    }

    missing = required_keys - set(user_data.keys())
    if missing:
        raise ValueError(f"Missing required user inputs: {missing}")

    # -------------------------
    # Run lightweight pipelines
    # -------------------------
    contextual = contextual_pipeline(user_data=user_data)
    peer = peer_pipeline(user_data=user_data)
    smart = smart_meter_pipeline(user_data=user_data)
    voltage = voltage_pipeline(user_data=user_data)
    transformer = transformer_pipeline(user_data=user_data)

    # -------------------------
    # Base consumer frame
    # -------------------------
    consumer_df = (
        user_data["consumer_transformer_mapping"]
        [["consumer_id", "transformer_id"]]
        .drop_duplicates()
    )

    # -------------------------
    # Optional heavy ML
    # -------------------------
    anomaly_df = None
    if run_anomaly_model:
        anomaly_df = anomaly_ml_pipeline(
            user_data={
                "smart_meter_data": user_data["smart_meter_data"],
                "context_data": user_data["context_data"],
                "consumer_transformer_mapping": user_data["consumer_transformer_mapping"],
            },
            model_path=anomaly_model_path,
        )

    # -------------------------
    # Aggregate + classify
    # -------------------------
    final_df = aggregate_risk_scores(
        consumer_df=consumer_df,
        contextual_df=contextual,
        peer_df=peer,
        smart_df=smart,
        voltage_df=voltage,
        transformer_df=transformer,
        anomaly_df=anomaly_df,
    )

    final_df = classify_risk(final_df)

    return final_df[
        [
            "consumer_id",
            "transformer_id",
            "aggregate_risk_score",
            "risk_class",
            "inspection_flag",
        ]
    ]
