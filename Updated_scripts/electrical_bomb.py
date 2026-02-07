# ============================================================
# FULL MULTI-LAYER RISK PIPELINE (WITH LOCATION SUPPORT)
# Google-Maps-Compatible Backend Model Code
# ============================================================

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.cluster import DBSCAN

# ============================================================
# 0. ADAPTER — PUBLIC BACKEND ENTRY POINT
# ============================================================

def run_pipeline(*, user_data: dict = None, merged_df: pd.DataFrame = None, run_anomaly_model: bool = False) -> pd.DataFrame:
    """
    Adapter to merge separate user CSVs into `merged_all_layers_dataset.csv` format
    and run the electrical_bomb pipeline.
    
    Can accept either `user_data` (dict of 5 DFs) OR `merged_df` (single DF).
    """
    
    if merged_df is not None:
        # Use provided merged dataframe directly
        merged = merged_df.copy()
        
        # Ensure date parsing if not already done
        if "date" in merged.columns and not pd.api.types.is_datetime64_any_dtype(merged["date"]):
             merged["date"] = pd.to_datetime(merged["date"], dayfirst=True, format="mixed")
             
    elif user_data is not None:
        REQUIRED = {
            "smart_meter_data",
            "consumer_transformer_mapping",
            "transformer_input_data",
            "voltage_pq_data",
            "context_data"
        }
        
        missing = REQUIRED - set(user_data.keys())
        if missing:
            raise ValueError(f"Missing required user inputs: {missing}")

        # 1. Load Data
        sm = user_data["smart_meter_data"].copy()
        mapping = user_data["consumer_transformer_mapping"].copy()
        trans = user_data["transformer_input_data"].copy()
        volt = user_data["voltage_pq_data"].copy()
        context = user_data["context_data"].copy()

        # 2. Date Parsing (Robust)
        for df, name in [(sm, "smart"), (trans, "trans"), (volt, "volt"), (context, "context")]:
            if "date" in df.columns:
                df["date"] = pd.to_datetime(df["date"], dayfirst=True, format="mixed")

        # 3. Merge Strategy
        # Base: Smart Meter (Consumer x Date)
        merged = sm.merge(mapping, on="consumer_id", how="inner")
        
        # Merge Context (on Date)
        merged = merged.merge(context, on="date", how="left")
        
        # Merge Transformer Input (on Transformer x Date)
        merged = merged.merge(trans, on=["transformer_id", "date"], how="left")
        
        # Merge Voltage (on Consumer x Date)
        merged = merged.merge(volt, on=["consumer_id", "date"], how="left")
        
    else:
        raise ValueError("Either user_data or merged_df must be provided.")
    
    # 4. Handle Missing Geo Data (Lat/Lon)
    if "latitude" not in merged.columns or "longitude" not in merged.columns:
        # Generate stable dummy coordinates based on consumer_id hash
        # To avoid DBSCAN failing or all points being at 0,0
        print("WARNING: Latitude/Longitude missing. Generating synthetic coordinates.")
        
        def get_dummy_lat_lon(uid):
            import hashlib
            h = int(hashlib.md5(uid.encode()).hexdigest(), 16)
            # Fake city center 28.6139, 77.2090 (New Delhi) + scatter
            lat = 28.6139 + (h % 1000) / 10000.0
            lon = 77.2090 + ((h >> 10) % 1000) / 10000.0
            return pd.Series([lat, lon])

        # We need per-consumer lat/lon. 
        # Create a tiny lookup frame to merge back, efficiently
        unique_consumers = merged[["consumer_id"]].drop_duplicates()
        coords = unique_consumers["consumer_id"].apply(get_dummy_lat_lon)
        coords.columns = ["latitude", "longitude"]
        unique_consumers = pd.concat([unique_consumers, coords], axis=1)
        
        merged = merged.merge(unique_consumers, on="consumer_id", how="left")

    # 5. Fill NaNs that break the model
    # Energy Input might be NaN if transformer data missing for that date
    # Voltage might be NaN
    merged["energy_input"] = merged["energy_input"].fillna(merged["energy_consumed"] * 1.05)
    merged["avg_voltage"] = merged["avg_voltage"].fillna(230)
    merged["voltage_variance"] = merged["voltage_variance"].fillna(0)
    merged["season"] = merged["season"].fillna("unknown")
    merged["temperature"] = merged["temperature"].fillna(25.0)

    # 6. Run Core Logic
    # We pass the merged dataframe to the core logic function
    final_results = _core_electrical_bomb_logic(merged)
    
    # 7. Format for Frontend
    # Frontend expects: consumer_id, transformer_id, aggregate_risk_score, risk_class, inspection_flag
    
    # Map 'final_risk' -> 'aggregate_risk_score'
    final_results = final_results.rename(columns={"final_risk": "aggregate_risk_score"})
    
    # Ensure all required columns exist
    if "risk_class" not in final_results.columns:
        # Logic is inside core classification, but let's verify
        pass
        
    return final_results

# ============================================================
# CORE LOGIC (Refactored from electrical_bomb.py)
# ============================================================

def _core_electrical_bomb_logic(merged_df: pd.DataFrame) -> pd.DataFrame:
    # ... Original logic ...
    
    # 1. BEHAVIORAL ANOMALY — ML
    behavior_features = (
        merged_df
        .groupby("consumer_id")
        .agg(
            mean_usage=("energy_consumed", "mean"),
            std_usage=("energy_consumed", "std"),
            min_usage=("energy_consumed", "min"),
            max_usage=("energy_consumed", "max"),
            trend=("energy_consumed", lambda x: x.iloc[-1] - x.iloc[0])
        )
        .fillna(0)
    )

    X_beh = RobustScaler().fit_transform(behavior_features)
    
    iso = IsolationForest(n_estimators=300, contamination=0.08, random_state=42)
    ml_raw = -iso.fit_predict(X_beh)
    ml_anomaly_risk = (ml_raw - ml_raw.min()) / (ml_raw.max() - ml_raw.min())
    ml_anomaly_df = pd.DataFrame({"ml_anomaly_risk": ml_anomaly_risk}, index=behavior_features.index)

    # 2. BEHAVIORAL ANOMALY — STATISTICAL
    stat_series = (
        merged_df
        .groupby("consumer_id")["energy_consumed"]
        .apply(lambda x: (x.mean() - x.min()) / (x.std() + 1e-6))
    )
    stat_anomaly_risk = (stat_series - stat_series.min()) / (stat_series.max() - stat_series.min())
    stat_anomaly_df = stat_anomaly_risk.to_frame("stat_anomaly_risk")

    # 3. TRANSFORMER LOSS
    tx_daily = (
        merged_df
        .groupby(["transformer_id", "date"])
        .agg(total_consumption=("energy_consumed", "sum"), energy_input=("energy_input", "mean"))
        .reset_index()
    )
    tx_daily['loss'] = tx_daily["energy_input"] - tx_daily["total_consumption"]
    tx_daily["loss_ratio"] = (tx_daily["energy_input"] - tx_daily["total_consumption"]) / tx_daily["energy_input"]
    tx_loss = tx_daily.groupby("transformer_id")["loss_ratio"].mean()
    tx_loss_risk = (tx_loss - tx_loss.min()) / (tx_loss.max() - tx_loss.min())
    total_loss_all_transformers = tx_daily["loss"].abs().sum()

    transformer_loss_df = (
        merged_df[["consumer_id", "transformer_id"]]
        .drop_duplicates()
        .merge(tx_loss_risk.rename("transformer_loss_risk"), on="transformer_id", how="left")
        .set_index("consumer_id")
    )

    # 4. PEER COMPARISON
    peer_stats = merged_df.groupby(["transformer_id", "consumer_id"])["energy_consumed"].mean().reset_index()
    peer_stats["peer_mean"] = peer_stats.groupby("transformer_id")["energy_consumed"].transform("mean")
    peer_stats["peer_std"] = peer_stats.groupby("transformer_id")["energy_consumed"].transform("std").replace(0, 1e-6)
    peer_stats["peer_deviation"] = peer_stats["peer_mean"] - peer_stats["energy_consumed"]
    peer_stats["peer_risk"] = peer_stats.apply(lambda r: r["peer_deviation"] / r["peer_std"] if r["peer_deviation"] > 0 else 0, axis=1)
    peer_risk = peer_stats.groupby("consumer_id")["peer_risk"].mean()
    peer_risk = (peer_risk - peer_risk.min()) / (peer_risk.max() - peer_risk.min())
    peer_df = peer_risk.to_frame("peer_risk")

    # 5. VOLTAGE / POWER QUALITY
    volt_stats = merged_df.groupby("transformer_id")["avg_voltage"].agg(["mean", "std"]).rename(columns={"mean": "v_mean", "std": "v_std"})
    volt_df_calc = merged_df.merge(volt_stats, on="transformer_id", how="left")
    volt_df_calc["v_std"] = volt_df_calc["v_std"].replace(0, 1e-6)
    volt_df_calc["v_dev"] = volt_df_calc["v_mean"] - volt_df_calc["avg_voltage"]
    volt_df_calc["voltage_risk"] = volt_df_calc.apply(lambda r: r["v_dev"] / r["v_std"] if r["v_dev"] >= 1.5 * r["v_std"] else 0, axis=1)
    voltage_risk = volt_df_calc.groupby("consumer_id")["voltage_risk"].mean()
    voltage_risk = (voltage_risk - voltage_risk.min()) / (voltage_risk.max() - voltage_risk.min())
    voltage_df = voltage_risk.to_frame("voltage_risk")

    # 6. SEASONAL
    seasonal_series = merged_df.groupby("consumer_id").apply(lambda x: x[x["season"] == "monsoon"]["energy_consumed"].mean() / (x["energy_consumed"].mean() + 1e-6))
    seasonal_risk = (seasonal_series - seasonal_series.min()) / (seasonal_series.max() - seasonal_series.min())
    seasonal_df = seasonal_risk.to_frame("seasonal_risk")

    # 7. FINAL AGGREGATION
    combined_df = (
        ml_anomaly_df
        .join(stat_anomaly_df)
        .join(peer_df)
        .join(transformer_loss_df)
        .join(voltage_df)
        .join(seasonal_df)
        .fillna(0)
    )

    combined_df["base_risk"] = (
        0.30 * combined_df["transformer_loss_risk"] +
        0.22 * combined_df["peer_risk"] +
        0.18 * combined_df["ml_anomaly_risk"] +
        0.07 * combined_df["stat_anomaly_risk"] +
        0.15 * combined_df["voltage_risk"] +
        0.08 * combined_df["seasonal_risk"]
    )

    combined_df["final_risk"] = combined_df["base_risk"] ** 1.6
    
    # 8. INSPECTION SELECTION (For frontend Risk Class)
    mean_r = combined_df["final_risk"].mean()
    std_r = combined_df["final_risk"].std()
    inspection_cutoff = max(combined_df["final_risk"].quantile(0.97), mean_r + 2 * std_r)
    
    def bucket(score):
        if score >= inspection_cutoff: return "critical"
        elif score >= combined_df['final_risk'].quantile(0.8): return "high"
        elif score >= combined_df['final_risk'].quantile(0.5): return "mild"
        else: return "normal"

    combined_df["risk_class"] = combined_df["final_risk"].apply(bucket)
    combined_df["inspection_flag"] = combined_df["final_risk"] >= inspection_cutoff
    transformer_anomaly_counts = combined_df[combined_df["inspection_flag"]].groupby("transformer_id").size()
    iqr_threshold = transformer_anomaly_counts.quantile(0.75) + 1.5 * (transformer_anomaly_counts.quantile(0.75) - transformer_anomaly_counts.quantile(0.25))
    transformer_risky = transformer_anomaly_counts[transformer_anomaly_counts > iqr_threshold]
    transformers_at_risk = [
    {
        "transformer_id": transformer_id,
        "anomalies_detected": int(count)
    }
    for transformer_id, count in transformer_risky.items()
]
    # Calculate Percentile for Frontend Display
    combined_df["risk_percentile"] = combined_df["final_risk"].rank(pct=True).fillna(0.0)
    
    # Restore consumer_id from index
    combined_df = combined_df.reset_index() # consumer_id
    
    # 9. INTEGRATE LOCATION DATA (Fix for Map)
    # We need to grab latitude/longitude back from the original merged_df
    # Since merged_df has many rows per consumer (time series), we take the first occurrence
    location_lookup = merged_df[["consumer_id", "latitude", "longitude"]].drop_duplicates(subset=["consumer_id"])
    combined_df = combined_df.merge(location_lookup, on="consumer_id", how="left")
    
    # Need transformer_id in output (is inside combined_df? No, it was in transformer_loss_df but lost if index join)
    # transformer_loss_df was joined, so 'transformer_id' should be there? 
    # join(transformer_loss_df) which has index consumer_id and columns [transformer_id, transformer_loss_risk]
    # So yes, transformer_id is in combined_df.
    
    return combined_df, total_loss_all_transformers, transformers_at_risk
