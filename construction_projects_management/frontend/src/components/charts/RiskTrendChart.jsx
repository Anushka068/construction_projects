import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

export default function RiskTrendChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await axios.get("http://localhost:5000/api/predict/delay/history");

        // Group by month
        const groups = {};

        res.data.history.forEach(r => {
          const month = r.created_at.slice(0, 7); // YYYY-MM
          if (!groups[month]) {
            groups[month] = { high: 0, medium: 0, low: 0 };
          }
          if (r.risk_level === "High") groups[month].high++;
          else if (r.risk_level === "Medium") groups[month].medium++;
          else groups[month].low++;
        });

        const formatted = Object.keys(groups).map(m => ({
          month: m,
          ...groups[m],
        }));

        setData(formatted);
      } catch (e) {
        console.error("RiskTrend error:", e);
      }
    }

    loadHistory();
  }, []);

  return (
    <div className="rounded-2xl p-6 border shadow-sm"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--chart-text)" }}>
        Risk Trends (Live)
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="var(--muted-text)" />
          <YAxis stroke="var(--muted-text)" />
          <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", borderRadius: 10 }} />
          <Legend />
          <Bar dataKey="high" fill="#ef4444" />
          <Bar dataKey="medium" fill="#f59e0b" />
          <Bar dataKey="low" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
