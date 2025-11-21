import React from "react";
import { insights } from "../data/dashboardData";

export default function AIInsights() {
  return (
    <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-indigo-700/20 dark:to-purple-700/20">
          <span className="text-2xl">🤖</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--chart-text)" }}>AI Insights</h3>
          <p className="text-sm" style={{ color: "var(--muted-text)" }}>Smart recommendations</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const isWarning = insight.type === "warning";
          const isSuccess = insight.type === "success";
          const bg = isWarning ? "bg-amber-50 dark:bg-amber-900/8" : isSuccess ? "bg-emerald-50 dark:bg-emerald-900/8" : "bg-rose-50 dark:bg-rose-900/8";
          const border = isWarning ? "border-amber-200 dark:border-amber-700/30" : isSuccess ? "border-emerald-200 dark:border-emerald-700/30" : "border-rose-200 dark:border-rose-700/30";
          const icon = isWarning ? "⚠️" : isSuccess ? "✅" : "🚨";
          const textColor = isWarning ? "text-amber-700 dark:text-amber-200" : isSuccess ? "text-emerald-700 dark:text-emerald-200" : "text-rose-700 dark:text-rose-200";

          return (
            <div key={i} className={`p-4 rounded-xl border ${border}`} style={{ background: "var(--card-bg)" }}>
              <div className="flex gap-3">
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${textColor}`}>{insight.title}</div>
                  <div className="text-xs" style={{ color: "var(--muted-text)" }}>{insight.message}</div>
                  <div className="text-xs" style={{ color: "var(--muted-text)" }}>{insight.time}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
