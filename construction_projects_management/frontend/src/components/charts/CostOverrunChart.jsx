import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

export default function CostOverrunChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await axios.get("http://localhost:5000/api/predict/cost-overrun/history");

        const items = res.data.history.map(item => ({
          timestamp: item.created_at.slice(0, 10),
          cost: item.output_payload.predicted_final_cost / 1000,   // convert to K
          predicted: item.output_payload.expected_overrun_percent,
        }));

        setData(items.reverse()); // newest last
      } catch (err) {
        console.error("Cost chart error:", err);
      }
    }

    loadHistory();
  }, []);

  return (
    <div className="rounded-2xl p-6 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--chart-text)" }}>
        Cost Overrun Predictions (Live)
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" stroke="var(--muted-text)" />
          <YAxis stroke="var(--muted-text)" />
          <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)" }} />
          <Legend wrapperStyle={{ color: "var(--muted-text)" }} />

          <Line
            type="monotone"
            dataKey="cost"
            stroke="var(--chart-line)"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Predicted Final Cost (₹K)"
          />

          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#f59e0b"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="Overrun %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
