"""Cost overrun prediction service with explainability and persistence."""

from __future__ import annotations

import json
import logging
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
import shap

from ml.config import (
    ALERT_THRESHOLD_PERCENT,
    ARTIFACT_PATH,
    BACKGROUND_SAMPLE_PATH,
    MODEL_VERSION,
    RISK_HIGH_THRESHOLD,
    RISK_MEDIUM_THRESHOLD,
)
from ml.features import (
    ALL_FEATURES,
    BASE_NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    DataValidator,
    engineer_features,
)
from ml.monitoring import DriftMonitor
from schemas import (
    CostIntervals,
    CostPredictionRequest,
    CostPredictionResponse,
    FactorContribution,
    PredictionIntervals,
    ScenarioSimulationRequest,
)
from storage import PredictionRepository

logger = logging.getLogger(__name__)


class CostOverrunService:
    """Encapsulates inference, monitoring, and persistence logic."""

    def __init__(
        self,
        artifact_path: str | None = None,
        background_path: str | None = None,
    ):
        self.artifact_path = artifact_path or ARTIFACT_PATH
        self.background_path = background_path or BACKGROUND_SAMPLE_PATH

        self.artifacts = joblib.load(self.artifact_path)
        self.model_version = self.artifacts["version"]
        self.model_name = self.artifacts.get("model_name", "lightgbm")
        self.model = self.artifacts["point_model"]
        self.quantile_lower = self.artifacts["quantile_lower"]
        self.quantile_upper = self.artifacts["quantile_upper"]
        self.feature_columns = self.artifacts["feature_columns"]
        self.reference_stats = self.artifacts.get("reference_stats", {})
        self.metrics = self.artifacts.get("metrics", {})

        self.background_df = self._load_background_sample()
        self.explainer = shap.TreeExplainer(
            self.model, feature_perturbation="tree_path_dependent"
        )
        self.validator = DataValidator()
        self.monitor = DriftMonitor(self.reference_stats)
        self.repo = PredictionRepository()

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def predict(
        self,
        payload: CostPredictionRequest,
        *,
        persist: bool = True,
    ) -> CostPredictionResponse:
        df = self._payload_to_frame(payload)
        validation = self.validator.validate(df)
        if not validation.is_valid:
            raise ValueError("; ".join(validation.issues))

        drift_signals = self.monitor.track(df)
        if drift_signals:
            logger.warning("Potential drift detected: %s", drift_signals)

        expected = float(self.model.predict(df)[0])
        lower = float(self.quantile_lower.predict(df)[0])
        upper = float(self.quantile_upper.predict(df)[0])

        final_cost = float(payload.final_project_cost * (1 + expected / 100))
        intervals = PredictionIntervals(p10=lower, expected=expected, p90=upper)
        cost_intervals = CostIntervals(
            p10=float(payload.final_project_cost * (1 + lower / 100)),
            expected=final_cost,
            p90=float(payload.final_project_cost * (1 + upper / 100)),
        )
        risk = self._risk_bucket(expected)
        alerts = self._build_alerts(expected, payload)
        contributors = self._explain(df)
        recommendations = self._recommendations(expected, contributors, payload)

        metrics = self.metrics.get(self.model_name, {"r2": float("nan"), "mae": float("nan")})
        response = CostPredictionResponse(
            model_version=self.model_version,
            expected_overrun_percent=expected,
            predicted_final_cost=final_cost,
            intervals=intervals,
            cost_intervals=cost_intervals,
            risk_level=risk,
            alerts=alerts,
            top_contributors=contributors,
            recommendations=recommendations,
            model_info={
                "version": self.model_version,
                "name": self.model_name,
                "r2": float(metrics.get("r2", float("nan"))),
                "mae": float(metrics.get("mae", float("nan"))),
            },
        )

        logger.info(
            "Cost prediction | model=%s v%s | r2=%.4f | mae=%.3f | expected=%.2f%% | risk=%s",
            self.model_name,
            self.model_version,
            metrics.get("r2", float("nan")),
            metrics.get("mae", float("nan")),
            expected,
            risk,
        )

        if persist:
            self.repo.log_prediction(
                model_version=self.model_version,
                input_payload=json.loads(payload.json()),
                output_payload=response.model_dump(),
                risk_level=risk,
                scenario_name=payload.scenario_name,
                alerts=alerts,
            )

        return response

    def simulate(self, request: ScenarioSimulationRequest) -> List[Dict]:
        base = request.base_project.dict()
        simulations = []

        for scenario in request.scenarios:
            overrides = scenario.overrides
            merged = {**base, **overrides, "scenario_name": scenario.name}
            response = self.predict(CostPredictionRequest(**merged), persist=False)
            simulations.append(
                {
                    "scenario": scenario.name,
                    "overrides": overrides,
                    "prediction": response.model_dump(),
                }
            )

        return simulations

    def history(self, limit: int = 50) -> List[Dict]:
        return self.repo.fetch_recent(limit)

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def _payload_to_frame(self, payload: CostPredictionRequest) -> pd.DataFrame:
        record = payload.dict()
        df = pd.DataFrame([record])

        # Fill missing numeric fields with sensible defaults
        for col in BASE_NUMERIC_FEATURES:
            if col not in df.columns:
                df[col] = 0.0
        for col in CATEGORICAL_FEATURES:
            if col not in df.columns:
                df[col] = "Unknown"

        df = engineer_features(df)
        for col in CATEGORICAL_FEATURES:
            if col in df.columns:
                df[col] = df[col].astype(str).astype("category")
        df = df[self.feature_columns]
        return df

    def _load_background_sample(self) -> pd.DataFrame:
        try:
            return pd.read_parquet(self.background_path)
        except Exception:  # noqa: broad-except
            logger.warning("Background sample missing; SHAP explanations may be degraded.")
            return pd.DataFrame()

    def _explain(self, df: pd.DataFrame) -> List[FactorContribution]:
        try:
            shap_values = self.explainer.shap_values(df)
            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            row = shap_values[0]
        except Exception as exc:  # noqa: broad-except
            logger.error("Failed to compute SHAP values: %s", exc)
            return []

        contributions = []
        feature_names = df.columns
        abs_impacts = np.abs(row)
        top_idx = np.argsort(abs_impacts)[::-1][:5]

        for idx in top_idx:
            impact = float(row[idx])
            contributions.append(
                FactorContribution(
                    feature=feature_names[idx],
                    impact=round(abs(impact), 3),
                    direction="positive" if impact >= 0 else "negative",
                )
            )

        return contributions

    def _risk_bucket(self, percent: float) -> str:
        if percent < RISK_MEDIUM_THRESHOLD:
            return "Low"
        if percent < RISK_HIGH_THRESHOLD:
            return "Medium"
        return "High"

    def _build_alerts(self, percent: float, payload: CostPredictionRequest) -> List[str]:
        alerts = []
        if percent >= ALERT_THRESHOLD_PERCENT:
            alerts.append("Predicted cost overrun exceeds alert threshold.")
        if payload.progress_ratio and payload.progress_ratio < 0.4:
            alerts.append("Low progress ratio with rising costs.")
        if payload.totalreceivedamount and payload.totalsellingamount:
            collection_eff = payload.totalreceivedamount / payload.totalsellingamount
            if collection_eff < 0.5:
                alerts.append("Collections below 50% of sales; liquidity risk.")
        return alerts

    def _recommendations(
        self,
        percent: float,
        contributors: List[FactorContribution],
        payload: CostPredictionRequest,
    ) -> List[str]:
        recs = []
        if percent >= RISK_HIGH_THRESHOLD:
            recs.append("Activate cost-control task force and re-baseline budget.")
        elif percent >= RISK_MEDIUM_THRESHOLD:
            recs.append("Tighten procurement approvals and monitor weekly.")
        else:
            recs.append("Maintain monthly monitoring cadence.")

        if payload.progress_ratio and payload.progress_ratio < 0.5:
            recs.append("Increase execution throughput to avoid compounding overruns.")

        for factor in contributors[:2]:
            if factor.feature in {"cashflow_pressure", "collection_efficiency"}:
                recs.append("Improve cash collection to reduce financing strain.")
                break
        return recs

