import React from "react";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { trendData } from "../../data/dashboardData";

export default function CostOverrunChart() {
  return (
    <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--chart-text)" }}>Cost Overrun Predictions</h3>
          <p className="text-sm" style={{ color: "var(--muted-text)" }}>6-month trend & forecast</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={trendData}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="var(--muted-text)" />
          <YAxis stroke="var(--muted-text)" />
          <Tooltip
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              color: "var(--chart-tooltip-color)",
              borderRadius: 12,
              border: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            }}
          />
          <Legend wrapperStyle={{ color: "var(--muted-text)" }} />
          <Line type="monotone" dataKey="cost" stroke="var(--chart-line)" strokeWidth={3} dot={{ r: 4 }} name="Actual Cost ($K)" />
          <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} name="Predicted ($K)" />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 rounded-xl border" style={{ background: "linear-gradient(180deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))", borderColor: "rgba(239,68,68,0.08)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm" style={{ color: "var(--muted-text)" }}>Expected Overrun (Next Quarter)</div>
            <div className="text-3xl font-bold text-rose-600 mt-1">$45,200</div>
          </div>
          <div className="text-5xl">💰</div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(239,68,68,0.06)" }}>
          <div className="text-xs" style={{ color: "var(--muted-text)" }}>AI Confidence: <span className="font-semibold text-rose-600">87%</span></div>
        </div>
      </div>
    </div>
  );
}
