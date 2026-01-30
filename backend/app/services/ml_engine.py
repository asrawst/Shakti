import pandas as pd
from typing import Dict

# Import YOUR real orchestrator

from scripts.electrical_bomb import run_pipeline

class MLEngine:
    def analyze(self, files: Dict[str, pd.DataFrame]) -> Dict:
        """
        Adapter between FastAPI uploads and real ML pipelines.
        """

        # ----------------------------
        # 1. Pipeline Routing (Merged vs Separate)
        # ----------------------------
        
        # Check if we have the single merged file
        # We look for a file that looks like the merged one (large, or specifically named)
        # Or if there's only 1 file and it has key columns
        
        input_file_names = list(files.keys())
        first_df = files[input_file_names[0]] if input_file_names else None
        
        is_merged_format = False
        if first_df is not None:
            required_merged_cols = {"consumer_id", "energy_consumed", "transformer_id"} 
            if required_merged_cols.issubset(first_df.columns):
                # It looks like a merged file
                is_merged_format = True

        if is_merged_format and len(files) == 1:
            # Single file path
            final_df = run_pipeline(
                merged_df=first_df,
                run_anomaly_model=False
            )
        else:
            # Standard 5-file path
            required_keys = {
                "smart_meter_data.csv": "smart_meter_data",
                "context_data.csv": "context_data",
                "consumer_transformer_mapping.csv": "consumer_transformer_mapping",
                "transformer_input_data.csv": "transformer_input_data",
                "voltage_pq_data.csv": "voltage_pq_data",
            }

            user_data = {}

            for filename, key in required_keys.items():
                if filename in files:
                    user_data[key] = files[filename]

            if not user_data:
                # If we are here, we didn't find standard names AND didn't detect a merged file structure clearly
                # Or maybe the user uploaded the merged file with a weird name and we failed detection
                raise ValueError("No valid input files provided. Please upload the 5 required CSVs or a single merged dataset.")

            final_df, total_loss_all_transformers = run_pipeline(
                user_data=user_data,
                run_anomaly_model=False, 
            )

        # ----------------------------
        # 3. Format output for frontend
        # ----------------------------
        # ----------------------------
        # 3. Format output for frontend
        # ----------------------------
        anomalies = final_df[final_df["risk_class"] != "normal"]
        
        # Calculate derived metrics
        total_consumers = len(final_df)
        n_anomalies = len(anomalies)
        critical_cases = (final_df["risk_class"] == "critical").sum()
        
        # Simple heuristics for missing business metrics
        grid_health = max(0, 100 - (n_anomalies / total_consumers * 100)) if total_consumers > 0 else 0
        total_loss = int(total_loss_all_transformers*9)
        response = {
            "summary": {
                "total_consumers": int(total_consumers),
                "anomalies_detected": int(n_anomalies),
                "critical_cases": int(critical_cases),
                "grid_health_score": round(grid_health, 1),
                "total_loss_calculated": f"{total_loss:,}",
            },
            "results": final_df.to_dict(orient="records"),
            "anomalies": anomalies.to_dict(orient="records"),
        }

        return response


ml_engine = MLEngine()
