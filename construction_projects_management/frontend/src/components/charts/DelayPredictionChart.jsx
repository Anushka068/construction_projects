import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { trendData } from "../../data/dashboardData";

export default function DelayPredictionChart() {
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
            Delay Analysis & Predictions
          </h3>
          <p className="text-sm" style={{ color: "var(--muted-text)" }}>
            AI-powered delay forecasting
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-area)" stopOpacity={0.32} />
              <stop offset="95%" stopColor="var(--chart-area)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="var(--muted-text)" />
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

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border" style={{ background: "linear-gradient(180deg, rgba(239,68,68,0.06), rgba(250,204,21,0.02))", borderColor: "rgba(239,68,68,0.08)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted-text)" }}>Avg Delay</div>
          <div className="text-2xl font-bold text-rose-600">12 days</div>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: "linear-gradient(180deg, rgba(250,204,21,0.06), rgba(250,204,21,0.02))", borderColor: "rgba(250,204,21,0.08)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted-text)" }}>Predicted Next</div>
          <div className="text-2xl font-bold text-amber-600">+8 days</div>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))", borderColor: "rgba(16,185,129,0.08)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted-text)" }}>On-Time Rate</div>
          <div className="text-2xl font-bold text-emerald-600">68%</div>
        </div>
      </div>
    </div>
  );
}
