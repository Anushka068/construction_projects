import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import axios from "axios";

export default function DelayPredictionChart() {
  const [chartData, setChartData] = useState([]);
  const [avgDelay, setAvgDelay] = useState(0);
  const [predictedNext, setPredictedNext] = useState(0);
  const [onTimeRate, setOnTimeRate] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get("http://localhost:5000/api/predict/delay/stats");

        const stats = res.data.stats;

        // Convert stats → chart friendly data
        const points = [
          { label: "Avg Probability", delay: stats.avg_delay_probability * 100 },
          { label: "Delay Rate", delay: stats.delay_rate },
          { label: "Avg Delay Days", delay: stats.avg_delay_days },
        ];

        setChartData(points);

        // Top summary values
        setAvgDelay(stats.avg_delay_days);
        setPredictedNext(stats.avg_delay_days / 2); // simple placeholder
        setOnTimeRate(((stats.on_time_count / stats.total_predictions) * 100).toFixed(1));

      } catch (error) {
        console.error("Failed to load delay stats:", error);
      }
    }

    loadStats();
  }, []);

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--chart-text)" }}>
            Delay Analysis (Live)
          </h3>
          <p className="text-sm" style={{ color: "var(--muted-text)" }}>
            Based on your prediction history
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-area)" stopOpacity={0.32} />
              <stop offset="95%" stopColor="var(--chart-area)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--muted-text)" />
          <YAxis stroke="var(--muted-text)" />
          <Tooltip
            wrapperStyle={{ outline: "none" }}
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              color: "var(--chart-tooltip-color)",
              borderRadius: 12,
              border: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            }}
          />

          <Area
            type="monotone"
            dataKey="delay"
            stroke="var(--chart-area)"
            strokeWidth={3}
            fill="url(#colorDelay)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Bottom summary cards */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border" style={{ background: "rgba(239,68,68,0.08)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted-text)" }}>
            Avg Delay
          </div>
          <div className="text-2xl font-bold text-rose-600">{avgDelay} days</div>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: "rgba(250,204,21,0.08)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted-text)" }}>
            Predicted Next
          </div>
          <div className="text-2xl font-bold text-amber-600">
            +{predictedNext.toFixed(1)} days
          </div>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: "rgba(16,185,129,0.08)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted-text)" }}>
            On-Time Rate
          </div>
          <div className="text-2xl font-bold text-emerald-600">{onTimeRate}%</div>
        </div>
      </div>
    </div>
  );
}
