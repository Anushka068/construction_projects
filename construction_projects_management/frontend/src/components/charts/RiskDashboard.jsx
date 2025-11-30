import React, { useEffect, useState } from "react";
import axios from "axios";

export default function RiskDashboard() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await axios.get("http://localhost:5000/api/predict/delay/history");

        const rows = res.data.history.map(r => ({
          id: r.id,
          name: `${r.districttype} / ${r.final_project_type}`,
          score: r.delay_probability * 100,
          delay: r.predicted_delay_days,
          budget: r.input_payload.budget_overrun_percent || 0,
        }));

        setItems(rows);
      } catch (err) {
        console.error("RiskDashboard error:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="rounded-2xl p-6 border shadow-sm"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--chart-text)" }}>
        Risk Assessment (Live)
      </h3>

      <div className="space-y-4">
        {items.map(project => {
          const isHigh = project.score > 70;
          const isMed = project.score > 40;

          const badgeClass = isHigh
            ? "bg-red-100 dark:bg-red-900/8 text-red-700 dark:text-red-300"
            : isMed
            ? "bg-yellow-100 dark:bg-yellow-900/8 text-yellow-700 dark:text-yellow-300"
            : "bg-green-100 dark:bg-green-900/8 text-green-700 dark:text-green-300";

          return (
            <div key={project.id} className="p-4 border rounded-xl"
              style={{ borderColor: "var(--card-border)" }}
            >
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-semibold" style={{ color: "var(--chart-text)" }}>
                    {project.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-text)" }}>
                    Score: {project.score.toFixed(1)} / 100
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                  {isHigh ? "High" : isMed ? "Moderate" : "Low"}
                </span>
              </div>

              <div className="text-xs" style={{ color: "var(--muted-text)" }}>
                <span className="mr-4">Delay: <b>{project.delay}d</b></span>
                <span>Budget: <b>{project.budget}%</b></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
