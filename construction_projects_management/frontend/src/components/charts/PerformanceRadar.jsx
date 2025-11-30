import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";

export default function PerformanceRadar() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get("http://localhost:5000/api/predict/delay/stats");
        const stats = res.data.stats;

        const radar = [
          { metric: "On-Time %", value: (stats.on_time_count / stats.total_predictions) * 100 },
          { metric: "High Risk %", value: stats.risk_counts.High },
          { metric: "Medium Risk %", value: stats.risk_counts.Medium },
          { metric: "Low Risk %", value: stats.risk_counts.Low },
          { metric: "Avg Delay Days", value: stats.avg_delay_days },
        ];

        setData(radar);
      } catch (e) {
        console.error("Radar error:", e);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="rounded-2xl p-6 border shadow-sm"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--chart-text)" }}>
        Project Performance (Live)
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis dataKey="metric" stroke="var(--muted-text)" />
          <PolarRadiusAxis stroke="var(--muted-text)" />
          <Radar name="Performance" dataKey="value" stroke="var(--chart-area)" fill="var(--chart-area)" fillOpacity={0.28} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
