"""SQLite persistence for prediction history."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from ml.config import PREDICTION_DB_PATH


class PredictionRepository:
    """Writes and reads prediction records for auditing."""

    def __init__(self, db_path: str | Path | None = None):
        self.db_path = Path(db_path or PREDICTION_DB_PATH)
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._ensure_tables()

    def _ensure_tables(self):
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cost_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                model_version TEXT NOT NULL,
                scenario_name TEXT,
                risk_level TEXT,
                alerts TEXT,
                input_payload TEXT NOT NULL,
                output_payload TEXT NOT NULL
            )
        """
        )
        self.conn.commit()

    def log_prediction(
        self,
        *,
        model_version: str,
        input_payload: Dict[str, Any],
        output_payload: Dict[str, Any],
        risk_level: str,
        scenario_name: str | None = None,
        alerts: List[str] | None = None,
    ):
        self.conn.execute(
            """
            INSERT INTO cost_predictions (
                created_at,
                model_version,
                scenario_name,
                risk_level,
                alerts,
                input_payload,
                output_payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (
                datetime.utcnow().isoformat(),
                model_version,
                scenario_name,
                risk_level,
                json.dumps(alerts or []),
                json.dumps(input_payload),
                json.dumps(output_payload),
            ),
        )
        self.conn.commit()

    def fetch_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = self.conn.execute(
            "SELECT * FROM cost_predictions ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        rows = cursor.fetchall()
        return [
            {
                "id": row["id"],
                "created_at": row["created_at"],
                "model_version": row["model_version"],
                "scenario_name": row["scenario_name"],
                "risk_level": row["risk_level"],
                "alerts": json.loads(row["alerts"] or "[]"),
                "input_payload": json.loads(row["input_payload"]),
                "output_payload": json.loads(row["output_payload"]),
            }
            for row in rows
        ]

    def aggregate_stats(self) -> Dict[str, Any]:
        cursor = self.conn.execute(
            "SELECT created_at, risk_level, output_payload FROM cost_predictions ORDER BY created_at DESC"
        )
        total = 0
        risk_counts = {"High": 0, "Medium": 0, "Low": 0}
        avg_percent = 0.0
        avg_cost = 0.0
        latest_ts = None

        for row in cursor:
            total += 1
            risk = row["risk_level"] or "Unknown"
            if risk in risk_counts:
                risk_counts[risk] += 1
            payload = json.loads(row["output_payload"])
            percent = payload.get("expected_overrun_percent")
            cost = payload.get("predicted_final_cost")
            if isinstance(percent, (int, float)):
                avg_percent += percent
            if isinstance(cost, (int, float)):
                avg_cost += cost
            latest_ts = latest_ts or row["created_at"]

        if total > 0:
            avg_percent /= total
            avg_cost /= total

        return {
            "total_predictions": total,
            "risk_counts": risk_counts,
            "avg_overrun_percent": round(avg_percent, 2),
            "avg_final_cost": round(avg_cost, 2),
            "latest_prediction_at": latest_ts,
        }


