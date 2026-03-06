"""
Electricity Theft Detection API Main Application.

This module initializes the FastAPI application, configures CORS,
and includes the necessary API routers for processing datasets.
"""

import sys
import os
from pathlib import Path

# Add the project root to sys.path to ensure absolute imports from 'app' work properly.
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

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
    """
    Health check endpoint.

    Returns:
        dict: A simple status message confirming the API is running.
    """
    return {"message": "Electricity Theft Detection System API is running"}
