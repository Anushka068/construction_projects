"""Feature engineering and validation utilities for cost overrun modeling."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd


BASE_NUMERIC_FEATURES: List[str] = [
    "final_project_cost",
    "totalincurredcost",
    "totallandcost",
    "totalsellingamount",
    "totalpayableamountgovernment",
    "totaldevelopcost",
    "totalreceivedamount",
    "bookedsellingamount",
    "bookedunits",
    "totalunits",
    "progress_ratio",
    "land_utilization",
    "planned_duration_days",
    "projectduration_planned_days",
    "avg_temp",
    "total_rain",
    "totalsquarefootbuild",
]

CATEGORICAL_FEATURES: List[str] = [
    "final_project_type",
    "promotertype",
    "districttype",
]

DERIVED_FEATURES: List[str] = [
    "cost_per_unit",
    "land_cost_ratio",
    "booking_rate",
    "collection_efficiency",
    "cashflow_pressure",
    "govt_dependency",
    "unit_revenue_gap",
    "duration_intensity",
    "progress_cost_ratio",
]

ALL_FEATURES = BASE_NUMERIC_FEATURES + DERIVED_FEATURES + CATEGORICAL_FEATURES


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create derived features aligned between training and inference."""
    df = df.copy()
    eps = 1e-6

    # Ensure numeric columns are properly typed before calculations
    for col in BASE_NUMERIC_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    # Handle project duration fields - ensure both exist and are numeric
    if "projectduration_planned_days" not in df.columns:
        df["projectduration_planned_days"] = pd.to_numeric(df.get("planned_duration_days", 0), errors='coerce').fillna(0.0)
    else:
        df["projectduration_planned_days"] = pd.to_numeric(df["projectduration_planned_days"], errors='coerce').fillna(0.0)
    
    if "planned_duration_days" not in df.columns:
        df["planned_duration_days"] = pd.to_numeric(df.get("projectduration_planned_days", 0), errors='coerce').fillna(0.0)
    else:
        df["planned_duration_days"] = pd.to_numeric(df["planned_duration_days"], errors='coerce').fillna(0.0)

    df["cost_per_unit"] = df["final_project_cost"] / (df["totalunits"] + 1)
    df["land_cost_ratio"] = df["totallandcost"] / (df["final_project_cost"] + eps)
    df["booking_rate"] = df["bookedunits"] / (df["totalunits"] + eps)
    df["collection_efficiency"] = df["totalreceivedamount"] / (df["totalsellingamount"] + eps)
    df["cashflow_pressure"] = (df["final_project_cost"] - df["totalreceivedamount"]) / (
        df["final_project_cost"] + eps
    )
    df["govt_dependency"] = df["totalpayableamountgovernment"] / (df["final_project_cost"] + eps)
    df["unit_revenue_gap"] = (df["bookedsellingamount"] - df["totalreceivedamount"]) / (
        df["bookedunits"] + 1
    )
    df["duration_intensity"] = df["planned_duration_days"] / (df["totalunits"] + 1)
    df["progress_cost_ratio"] = df["progress_ratio"] / (
        (df["final_project_cost"] / 1e7) + 1
    )

    # Ensure all derived features are numeric
    for col in DERIVED_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    return df


@dataclass
class DataValidationResult:
    is_valid: bool
    issues: List[str]


class DataValidator:
    """Light-weight input validation to fail fast on corrupted payloads."""

    numeric_bounds: Dict[str, Dict[str, float]] = {
        "final_project_cost": {"min": 1e5, "max": 5e11},
        "progress_ratio": {"min": 0.0, "max": 1.2},
        "land_utilization": {"min": 0.0, "max": 2.0},
        "totalunits": {"min": 1, "max": 2e5},
        "bookedunits": {"min": 0, "max": 2e5},
        "planned_duration_days": {"min": 30, "max": 10000},
    }

    required_fields = [
        "final_project_cost",
        "totalunits",
        "bookedunits",
        "totalsellingamount",
        "totalreceivedamount",
        "planned_duration_days",
        "promotertype",
        "final_project_type",
        "districttype",
    ]

    def validate(self, df: pd.DataFrame) -> DataValidationResult:
        issues: List[str] = []
        row = df.iloc[0]

        for field in self.required_fields:
            if pd.isna(row.get(field)):
                issues.append(f"Field '{field}' is required but missing.")

        for field, bounds in self.numeric_bounds.items():
            value = row.get(field)
            if pd.isna(value):
                continue
            if "min" in bounds and value < bounds["min"]:
                issues.append(f"{field} below minimum ({value} < {bounds['min']}).")
            if "max" in bounds and value > bounds["max"]:
                issues.append(f"{field} above maximum ({value} > {bounds['max']}).")

        return DataValidationResult(is_valid=not issues, issues=issues)


