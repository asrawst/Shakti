import sys
import os
from pathlib import Path

# Fix ModuleNotFoundError for 'scripts'
# Add the project root and scripts directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
# sys.path.append(str(BASE_DIR / "scripts")) # Removed scripts dir

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(title="Electricity Theft Detection API")

import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev flexibility (ports 5173, 5174, etc)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Electricity Theft Detection System API is running"}
