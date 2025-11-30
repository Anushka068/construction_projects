import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AIInsights() {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await axios.get("http://localhost:5000/api/predict/delay/history?limit=5");

        const list = res.data.history.map(i => ({
          type: i.risk_level === "High" ? "danger" : i.risk_level === "Medium" ? "warning" : "success",
          title: `Risk: ${i.risk_level}`,
          message: i.recommendations[0] || "No recommendations",
          time: i.created_at.replace("T", " ").slice(0, 16),
        }));

        setInsights(list);
      } catch (e) {
        console.error("AIInsights error:", e);
      }
    }

    loadInsights();
  }, []);

  return (
    <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)" }}>
      <h3 className="text-lg font-semibold mb-4">AI Insights</h3>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="p-4 rounded-xl border bg-[#111827]/20">
            <div className="text-sm font-semibold">{insight.title}</div>
            <div className="text-xs opacity-80">{insight.message}</div>
            <div className="text-xs opacity-50">{insight.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
