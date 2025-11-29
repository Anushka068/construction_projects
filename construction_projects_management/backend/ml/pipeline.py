"""Training pipeline for the production-grade cost overrun model."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from .config import (
    ARTIFACT_PATH,
    BACKGROUND_SAMPLE_PATH,
    DATASET_PATH,
    MODEL_VERSION,
)
from .features import (
    ALL_FEATURES,
    BASE_NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    DERIVED_FEATURES,
    engineer_features,
)


CandidateModel = Tuple[str, object]


def compute_target(df: pd.DataFrame) -> pd.Series:
    """Derive budget_overrun_percent when not supplied."""
    if "budget_overrun_percent" in df.columns:
        col = df["budget_overrun_percent"]
        if col.abs().sum(skipna=True) > 0:
            return col

    effective_cost = (
        df.get("totalincurredcost", 0).fillna(0)
        + df.get("totallandcost", 0).fillna(0)
        + df.get("totalpayableamountgovernment", 0).fillna(0)
    )
    base_cost = df.get("final_project_cost", 0).replace(0, np.nan)
    return ((effective_cost - base_cost) / base_cost) * 100


@dataclass
class TrainingMetrics:
    model_name: str
    r2: float
    mae: float


class CostOverrunPipeline:
    """Train/evaluate/save production model assets."""

    def __init__(
        self,
        dataset_path: str | None = None,
        artifact_path: str | None = None,
        background_path: str | None = None,
        random_state: int = 42,
    ):
        self.dataset_path = dataset_path or DATASET_PATH
        self.artifact_path = artifact_path or ARTIFACT_PATH
        self.background_path = background_path or BACKGROUND_SAMPLE_PATH
        self.random_state = random_state

        self.point_model = None
        self.point_model_name = ""
        self.quantile_lower = None
        self.quantile_upper = None
        self.metrics: Dict[str, TrainingMetrics] = {}
        self.feature_columns: List[str] = []
        self.reference_stats: Dict[str, Dict[str, float]] = {}

    # --------------------------------------------------------------------- #
    # Training workflow
    # --------------------------------------------------------------------- #
    def load_dataset(self) -> Tuple[pd.DataFrame, pd.Series]:
        df = pd.read_csv(self.dataset_path)
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df.dropna(subset=["final_project_cost", "totalunits"], inplace=True)

        df = engineer_features(df)
        for col in CATEGORICAL_FEATURES:
            if col in df.columns:
                df[col] = df[col].astype(str).fillna("Unknown").astype("category")
        target = compute_target(df).clip(-50, 200)
        df = df.assign(budget_overrun_percent=target)
        df.dropna(subset=["budget_overrun_percent"], inplace=True)

        self.feature_columns = BASE_NUMERIC_FEATURES + DERIVED_FEATURES + CATEGORICAL_FEATURES

        return df[self.feature_columns], df["budget_overrun_percent"]

    def train_point_models(
        self, X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame, y_val: pd.Series
    ):
        candidates: List[CandidateModel] = [
            (
                "catboost",
                CatBoostRegressor(
                    depth=6,
                    learning_rate=0.05,
                    iterations=600,
                    loss_function="RMSE",
                    random_seed=self.random_state,
                    verbose=False,
                ),
            ),
            (
                "lightgbm",
                LGBMRegressor(
                    n_estimators=700,
                    learning_rate=0.05,
                    max_depth=-1,
                    colsample_bytree=0.85,
                    subsample=0.85,
                    random_state=self.random_state,
                ),
            ),
            (
                "xgboost",
                XGBRegressor(
                    n_estimators=700,
                    learning_rate=0.05,
                    max_depth=6,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    reg_lambda=1.0,
                    reg_alpha=0.5,
                    random_state=self.random_state,
                    tree_method="hist",
                    objective="reg:squarederror",
                    enable_categorical=True,
                ),
            ),
        ]

        best_mae = np.inf
        best_model = None
        best_name = ""

        cat_indices = [
            idx
            for idx, col in enumerate(self.feature_columns)
            if col in CATEGORICAL_FEATURES
        ]

        for name, model in candidates:
            if name == "catboost":
                model.fit(X_train, y_train, cat_features=cat_indices)
            elif name == "lightgbm":
                model.fit(
                    X_train,
                    y_train,
                    categorical_feature=[c for c in CATEGORICAL_FEATURES if c in X_train.columns],
                )
            else:
                model.fit(X_train, y_train)
            preds = model.predict(X_val)
            mae = mean_absolute_error(y_val, preds)
            r2 = r2_score(y_val, preds)
            self.metrics[name] = TrainingMetrics(model_name=name, r2=float(r2), mae=float(mae))

            if mae < best_mae:
                best_mae = mae
                best_model = model
                best_name = name

        self.point_model = best_model
        self.point_model_name = best_name

    def train_quantile_models(self, X_train: pd.DataFrame, y_train: pd.Series):
        lower = LGBMRegressor(
            objective="quantile",
            alpha=0.1,
            n_estimators=500,
            learning_rate=0.05,
            max_depth=-1,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=self.random_state,
        )
        upper = LGBMRegressor(
            objective="quantile",
            alpha=0.9,
            n_estimators=500,
            learning_rate=0.05,
            max_depth=-1,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=self.random_state,
        )

        categorical = [c for c in CATEGORICAL_FEATURES if c in X_train.columns]
        lower.fit(X_train, y_train, categorical_feature=categorical)
        upper.fit(X_train, y_train, categorical_feature=categorical)

        self.quantile_lower = lower
        self.quantile_upper = upper

    def compute_reference_stats(self, df: pd.DataFrame):
        ref = {}
        for col in BASE_NUMERIC_FEATURES + DERIVED_FEATURES:
            if col not in df.columns:
                continue
            ref[col] = {
                "mean": float(df[col].mean()),
                "std": float(df[col].std(ddof=0) or 0.0),
            }
        self.reference_stats = ref

    def save_background_sample(self, df: pd.DataFrame):
        sample = df.sample(min(2000, len(df)), random_state=self.random_state)
        sample.to_parquet(self.background_path, index=False)

    def save_artifacts(self, X_train: pd.DataFrame):
        payload = {
            "version": MODEL_VERSION,
            "saved_at": datetime.utcnow().isoformat(),
            "model_name": self.point_model_name,
            "feature_columns": self.feature_columns,
            "metrics": {k: vars(v) for k, v in self.metrics.items()},
            "reference_stats": self.reference_stats,
            "point_model": self.point_model,
            "quantile_lower": self.quantile_lower,
            "quantile_upper": self.quantile_upper,
        }
        joblib.dump(payload, self.artifact_path)
        self.save_background_sample(X_train)

    def run(self):
        X, y = self.load_dataset()
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=self.random_state
        )
        self.train_point_models(X_train, y_train, X_val, y_val)
        self.train_quantile_models(X_train, y_train)
        self.compute_reference_stats(pd.concat([X_train, X_val], axis=0))
        self.save_artifacts(X_train)

        summary = {
            "version": MODEL_VERSION,
            "selected_model": self.point_model_name,
            "metrics": {k: vars(v) for k, v in self.metrics.items()},
        }
        print(json.dumps(summary, indent=2))

