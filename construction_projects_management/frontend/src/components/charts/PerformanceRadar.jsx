import React from "react";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { projectPerformance } from "../../data/dashboardData";

export default function PerformanceRadar() {
  return (
    <div className="rounded-2xl p-6 border shadow-sm" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--chart-text)" }}>Project Performance</h3>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={projectPerformance}>
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis dataKey="metric" stroke="var(--muted-text)" />
          <PolarRadiusAxis stroke="var(--muted-text)" />
          <Radar name="Performance" dataKey="value" stroke="var(--chart-area)" fill="var(--chart-area)" fillOpacity={0.28} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
