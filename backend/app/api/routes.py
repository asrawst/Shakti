from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import pandas as pd
import io
from app.services.ml_engine import ml_engine

router = APIRouter()

@router.post("/analyze")
async def analyze_data(
    files: List[UploadFile] = File(...)
):
    try:
        dataframes = {}
        
        for file in files:
            if not file.filename.endswith('.csv'):
                continue
                
            content = await file.read()
            # Read into pandas
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            
            # Global Type Fix: Ensure consumer_id and transformer_id are strings
            if "consumer_id" in df.columns:
                df["consumer_id"] = df["consumer_id"].astype(str)
            if "transformer_id" in df.columns:
                df["transformer_id"] = df["transformer_id"].astype(str)
                
            dataframes[file.filename] = df
            
        if not dataframes:
            raise HTTPException(status_code=400, detail="No valid CSV files provided")
            
        # Run analysis
        result = ml_engine.analyze(dataframes)
        
        return {
            "status": "success",
            "data": result
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
