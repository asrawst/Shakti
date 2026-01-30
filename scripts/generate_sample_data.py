import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_data(output_dir="sample_data"):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Consumer - Transformer Mapping
    n_consumers = 50
    n_transformers = 5
    
    consumers = [f"C{i:04d}" for i in range(n_consumers)]
    transformers = [f"T{i:02d}" for i in range(n_transformers)]
    
    mapping_data = {
        "consumer_id": consumers,
        "transformer_id": [transformers[i % n_transformers] for i in range(n_consumers)]
    }
    df_mapping = pd.DataFrame(mapping_data)
    df_mapping.to_csv(f"{output_dir}/consumer_transformer_mapping.csv", index=False)
    print(f"Generated {output_dir}/consumer_transformer_mapping.csv")

    # 2. Context Data (Seasons, Temp)
    start_date = datetime(2023, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(30)]
    
    context_data = {
        "date": dates,
        "season": ["Winter"] * 30,
        "temperature": np.random.uniform(5, 15, 30).round(1)
    }
    df_context = pd.DataFrame(context_data)
    df_context.to_csv(f"{output_dir}/context_data.csv", index=False)
    print(f"Generated {output_dir}/context_data.csv")
    
    # 3. Smart Meter Data
    sm_records = []
    for c in consumers:
        base_consumption = np.random.uniform(10, 20)
        for d in dates:
            # Add some anomalies for C0000
            consumption = base_consumption + np.random.normal(0, 2)
            if c == "C0000" and d.day % 5 == 0:
                consumption *= 0.1 # Theft!
                
            sm_records.append({
                "consumer_id": c,
                "date": d,
                "energy_consumed": max(0, consumption)
            })
    df_sm = pd.DataFrame(sm_records)
    df_sm.to_csv(f"{output_dir}/smart_meter_data.csv", index=False)
    print(f"Generated {output_dir}/smart_meter_data.csv")

    # 4. Voltage PQ Data
    voltage_records = []
    for c in consumers:
        for d in dates:
            base_v = 230
            # Add anomalies for C0000
            if c == "C0000" and d.day % 7 == 0:
                v = 200 # Low voltage
                var = 15 # High variance
            else:
                v = np.random.normal(230, 2)
                var = np.random.uniform(0, 5)
            
            voltage_records.append({
                "consumer_id": c,
                "date": d,
                "avg_voltage": v,
                "voltage_variance": var
            })
    df_voltage = pd.DataFrame(voltage_records)
    df_voltage.to_csv(f"{output_dir}/voltage_pq_data.csv", index=False)
    print(f"Generated {output_dir}/voltage_pq_data.csv")

    # 5. Transformer Input Data
    # Sum of consumer consumption + technical loss
    df_sm_agg = df_sm.groupby(["date", "consumer_id"])["energy_consumed"].sum().reset_index()
    # Join with mapping
    df_merged = df_sm_agg.merge(df_mapping, on="consumer_id")
    
    trans_records = []
    for t in transformers:
        for d in dates:
            # Sum of consumers on this transformer
            total_load = df_merged[
                (df_merged["transformer_id"] == t) & 
                (df_merged["date"] == d)
            ]["energy_consumed"].sum()
            
            # Technical loss ~ 5%
            input_energy = total_load / 0.95
            
            trans_records.append({
                "transformer_id": t,
                "date": d,
                "energy_input": input_energy
            })
    df_trans = pd.DataFrame(trans_records)
    df_trans.to_csv(f"{output_dir}/transformer_input_data.csv", index=False)
    print(f"Generated {output_dir}/transformer_input_data.csv")

if __name__ == "__main__":
    generate_data()
