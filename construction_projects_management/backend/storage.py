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
        # Cost overrun predictions table
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
        
        # Delay predictions table
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS delay_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                model_version TEXT,
                is_delayed INTEGER NOT NULL,
                delay_probability REAL NOT NULL,
                predicted_delay_days INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                confidence TEXT NOT NULL,
                extreme_override_applied INTEGER NOT NULL,
                ensemble_used INTEGER NOT NULL,
                recommendations TEXT,
                input_payload TEXT NOT NULL,
                output_payload TEXT NOT NULL,
                -- Key input fields for analytics (denormalized for easier queries)
                final_project_cost REAL,
                totalunits INTEGER,
                planned_duration_days INTEGER,
                actual_duration_days INTEGER,
                progress_ratio REAL,
                budget_overrun_percent REAL,
                bookedunits INTEGER,
                land_utilization REAL,
                final_project_type TEXT,
                promotertype TEXT,
                districttype TEXT,
                avg_temp REAL,
                total_rain REAL
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

    def log_delay_prediction(
        self,
        *,
        input_payload: Dict[str, Any],
        output_payload: Dict[str, Any],
        recommendations: List[str] | None = None,
        ensemble_used: bool = False,
        model_version: str | None = None,
    ):
        """Log a delay prediction to the database."""
        prediction = output_payload.get("prediction", {})
        
        # Extract key fields for analytics (denormalized)
        input_data = input_payload
        
        self.conn.execute(
            """
            INSERT INTO delay_predictions (
                created_at,
                model_version,
                is_delayed,
                delay_probability,
                predicted_delay_days,
                risk_level,
                confidence,
                extreme_override_applied,
                ensemble_used,
                recommendations,
                input_payload,
                output_payload,
                final_project_cost,
                totalunits,
                planned_duration_days,
                actual_duration_days,
                progress_ratio,
                budget_overrun_percent,
                bookedunits,
                land_utilization,
                final_project_type,
                promotertype,
                districttype,
                avg_temp,
                total_rain
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                datetime.utcnow().isoformat(),
                model_version,
                1 if prediction.get("is_delayed", False) else 0,
                float(prediction.get("delay_probability", 0.0)),
                int(prediction.get("predicted_delay_days", 0)),
                prediction.get("risk_level", "Unknown"),
                prediction.get("confidence", "Unknown"),
                1 if prediction.get("extreme_override_applied", False) else 0,
                1 if ensemble_used else 0,
                json.dumps(recommendations or []),
                json.dumps(input_payload),
                json.dumps(output_payload),
                float(input_data.get("final_project_cost", 0) or 0),
                int(input_data.get("totalunits", 0) or 0),
                int(input_data.get("planned_duration_days", 0) or 0),
                int(input_data.get("actual_duration_days", 0) or 0),
                float(input_data.get("progress_ratio", 0) or 0) if input_data.get("progress_ratio") else None,
                float(input_data.get("budget_overrun_percent", 0) or 0) if input_data.get("budget_overrun_percent") else None,
                int(input_data.get("bookedunits", 0) or 0) if input_data.get("bookedunits") else None,
                float(input_data.get("land_utilization", 0) or 0) if input_data.get("land_utilization") else None,
                input_data.get("final_project_type"),
                input_data.get("promotertype"),
                input_data.get("districttype"),
                float(input_data.get("avg_temp", 0) or 0) if input_data.get("avg_temp") else None,
                float(input_data.get("total_rain", 0) or 0) if input_data.get("total_rain") else None,
            ),
        )
        self.conn.commit()

    def fetch_recent_delays(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent delay predictions."""
        cursor = self.conn.execute(
            "SELECT * FROM delay_predictions ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        rows = cursor.fetchall()
        return [
            {
                "id": row["id"],
                "created_at": row["created_at"],
                "model_version": row["model_version"],
                "is_delayed": bool(row["is_delayed"]),
                "delay_probability": row["delay_probability"],
                "predicted_delay_days": row["predicted_delay_days"],
                "risk_level": row["risk_level"],
                "confidence": row["confidence"],
                "extreme_override_applied": bool(row["extreme_override_applied"]),
                "ensemble_used": bool(row["ensemble_used"]),
                "recommendations": json.loads(row["recommendations"] or "[]"),
                "input_payload": json.loads(row["input_payload"]),
                "output_payload": json.loads(row["output_payload"]),
            }
            for row in rows
        ]

    def aggregate_delay_stats(self) -> Dict[str, Any]:
        """Calculate aggregate statistics for delay predictions."""
        cursor = self.conn.execute(
            "SELECT * FROM delay_predictions ORDER BY created_at DESC"
        )
        total = 0
        delayed_count = 0
        risk_counts = {"High": 0, "Medium": 0, "Low": 0}
        avg_probability = 0.0
        avg_delay_days = 0.0
        total_delay_days = 0
        confidence_counts = {"High": 0, "Medium": 0, "Low": 0}
        project_type_counts = {}
        district_counts = {}
        latest_ts = None

        for row in cursor:
            total += 1
            if row["is_delayed"]:
                delayed_count += 1
                total_delay_days += row["predicted_delay_days"]
            
            risk = row["risk_level"] or "Unknown"
            if risk in risk_counts:
                risk_counts[risk] += 1
            
            avg_probability += row["delay_probability"]
            
            confidence = row["confidence"] or "Unknown"
            if confidence in confidence_counts:
                confidence_counts[confidence] += 1
            
            project_type = row["final_project_type"]
            if project_type:
                project_type_counts[project_type] = project_type_counts.get(project_type, 0) + 1
            
            district = row["districttype"]
            if district:
                district_counts[district] = district_counts.get(district, 0) + 1
            
            latest_ts = latest_ts or row["created_at"]

        if total > 0:
            avg_probability /= total
            if delayed_count > 0:
                avg_delay_days = total_delay_days / delayed_count

        return {
            "total_predictions": total,
            "delayed_count": delayed_count,
            "on_time_count": total - delayed_count,
            "delay_rate": round((delayed_count / total * 100) if total > 0 else 0, 2),
            "risk_counts": risk_counts,
            "avg_delay_probability": round(avg_probability, 4),
            "avg_delay_days": round(avg_delay_days, 1),
            "confidence_counts": confidence_counts,
            "project_type_distribution": project_type_counts,
            "district_distribution": district_counts,
            "latest_prediction_at": latest_ts,
        }

    def aggregate_stats(self) -> Dict[str, Any]:
        """Calculate aggregate statistics for cost overrun predictions."""
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


