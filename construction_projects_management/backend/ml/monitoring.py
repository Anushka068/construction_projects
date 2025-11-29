"""Simple drift monitoring utilities."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd

from .config import DRIFT_ZSCORE_THRESHOLD


@dataclass
class DriftSignal:
    feature: str
    zscore: float
    current_value: float
    reference_mean: float


class DriftMonitor:
    """Compares live feature values against reference statistics."""

    def __init__(self, reference_stats: Dict[str, Dict[str, float]] | None = None):
        self.reference_stats = reference_stats or {}

    def track(self, df: pd.DataFrame) -> List[DriftSignal]:
        if not self.reference_stats:
            return []

        signals: List[DriftSignal] = []
        row = df.iloc[0]

        for feature, stats in self.reference_stats.items():
            if feature not in row or pd.isna(row[feature]):
                continue

            std = stats.get("std") or 0.0
            if std == 0:
                continue

            zscore = abs((row[feature] - stats["mean"]) / std)
            if zscore >= DRIFT_ZSCORE_THRESHOLD:
                signals.append(
                    DriftSignal(
                        feature=feature,
                        zscore=float(zscore),
                        current_value=float(row[feature]),
                        reference_mean=float(stats["mean"]),
                    )
                )

        return signals


