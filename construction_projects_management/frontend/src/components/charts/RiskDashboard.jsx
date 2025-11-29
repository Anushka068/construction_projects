import React from "react";
import { riskProjects } from "../../data/dashboardData";

export default function RiskDashboard() {
  return (
    <div className="rounded-2xl p-6 border shadow-sm" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--chart-text)" }}>Risk Assessment</h3>

      <div className="space-y-4">
        {riskProjects.map(project => {
          const isHigh = project.score > 70;
          const isMed = project.score > 40;

          const badgeClass = isHigh
            ? "bg-red-100 dark:bg-red-900/8 text-red-700 dark:text-red-300"
            : isMed
            ? "bg-yellow-100 dark:bg-yellow-900/8 text-yellow-700 dark:text-yellow-300"
            : "bg-green-100 dark:bg-green-900/8 text-green-700 dark:text-green-300";

          return (
            <div key={project.id} className="p-4 border rounded-xl hover:shadow-md transition" style={{ borderColor: "var(--card-border)" }}>
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-semibold" style={{ color: "var(--chart-text)" }}>{project.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted-text)" }}>Score: {project.score}/100</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                  {isHigh ? "High" : isMed ? "Moderate" : "Low"}
                </span>
              </div>

              <div className="text-xs" style={{ color: "var(--muted-text)" }}>
                <span className="mr-4">Delay: <b style={{ color: "var(--chart-text)" }}>{project.delay}d</b></span>
                <span>Budget: <b style={{ color: "var(--chart-text)" }}>${project.budget}K</b></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
