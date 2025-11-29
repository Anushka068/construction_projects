"""Pydantic schemas for cost overrun APIs."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, validator


class CostPredictionRequest(BaseModel):
    final_project_cost: float = Field(..., gt=0)
    totalincurredcost: Optional[float] = None
    totallandcost: Optional[float] = None
    totalsellingamount: Optional[float] = None
    totalpayableamountgovernment: Optional[float] = None
    totaldevelopcost: Optional[float] = None
    totalreceivedamount: Optional[float] = None
    bookedsellingamount: Optional[float] = None
    bookedunits: Optional[float] = None
    totalunits: float = Field(..., gt=0)
    progress_ratio: Optional[float] = None
    land_utilization: Optional[float] = None
    planned_duration_days: float = Field(..., gt=0)
    projectduration_planned_days: Optional[float] = None
    avg_temp: Optional[float] = None
    total_rain: Optional[float] = None
    totalsquarefootbuild: Optional[float] = None
    final_project_type: str
    promotertype: str
    districttype: str
    scenario_name: Optional[str] = None

    @validator("projectduration_planned_days", pre=True, always=True)
    def default_project_duration(cls, value, values):
        if value is None:
            return values.get("planned_duration_days")
        return value

    @validator("bookedunits", pre=True, always=True)
    def default_bookings(cls, value, values):
        if value is None:
            return values.get("totalunits", 0) * 0.6
        return value

    @validator("totalsellingamount", pre=True, always=True)
    def default_selling(cls, value, values):
        if value is None:
            return values.get("final_project_cost", 0) * 1.2
        return value

    @validator("totalreceivedamount", pre=True, always=True)
    def default_receipts(cls, value, values):
        if value is None:
            return values.get("totalsellingamount", 0) * 0.5
        return value

    @validator("bookedsellingamount", pre=True, always=True)
    def default_booked_sales(cls, value, values):
        if value is None:
            return values.get("totalsellingamount", 0) * 0.7
        return value


class ScenarioAdjustment(BaseModel):
    name: str
    overrides: dict


class ScenarioSimulationRequest(BaseModel):
    base_project: CostPredictionRequest
    scenarios: List[ScenarioAdjustment]


class FactorContribution(BaseModel):
    feature: str
    impact: float
    direction: str


class PredictionIntervals(BaseModel):
    p10: float
    expected: float
    p90: float


class CostIntervals(BaseModel):
    p10: float
    expected: float
    p90: float


class ModelInfo(BaseModel):
    version: str
    name: str
    r2: float
    mae: float


class CostPredictionResponse(BaseModel):
    model_version: str
    expected_overrun_percent: float
    predicted_final_cost: float
    intervals: PredictionIntervals
    cost_intervals: CostIntervals
    risk_level: str
    alerts: List[str]
    top_contributors: List[FactorContribution]
    recommendations: List[str]
    model_info: ModelInfo

