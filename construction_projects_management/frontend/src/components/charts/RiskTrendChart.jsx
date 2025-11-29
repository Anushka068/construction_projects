import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { riskTrendData } from "../../data/dashboardData";

export default function RiskTrendChart() {
  return (
    <div className="rounded-2xl p-6 border shadow-sm" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--chart-text)" }}>Risk Trends</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={riskTrendData}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="var(--muted-text)" />
          <YAxis stroke="var(--muted-text)" />
          <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)", borderRadius: 10 }} />
          <Legend wrapperStyle={{ color: "var(--muted-text)" }} />
          <Bar dataKey="high" fill="#ef4444" />
          <Bar dataKey="medium" fill="#f59e0b" />
          <Bar dataKey="low" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
