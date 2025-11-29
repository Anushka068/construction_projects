"""Central configuration for the cost overrun ML pipeline."""

from __future__ import annotations

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "dataset" / "Weather_Enriched_Projects_Final.csv"
ARTIFACT_DIR = BASE_DIR / "models" / "cost_overrun"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_VERSION = "v2.0.0"
ARTIFACT_PATH = ARTIFACT_DIR / f"cost_overrun_{MODEL_VERSION}.joblib"
BACKGROUND_SAMPLE_PATH = ARTIFACT_DIR / f"background_{MODEL_VERSION}.parquet"

PREDICTION_DB_PATH = BASE_DIR / "data" / "predictions.db"
PREDICTION_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Monitoring thresholds
DRIFT_ZSCORE_THRESHOLD = 3.0
ALERT_THRESHOLD_PERCENT = 25.0
RISK_MEDIUM_THRESHOLD = 10.0
RISK_HIGH_THRESHOLD = 25.0


