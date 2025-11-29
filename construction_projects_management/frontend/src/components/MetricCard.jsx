import React from "react";

export default function MetricCard({ title, value, change, icon, trend }) {
  const isPositive = change >= 0;
  const trendColor =
    trend === "good"
      ? "text-emerald-600 dark:text-emerald-300"
      : trend === "bad"
      ? "text-rose-600 dark:text-rose-300"
      : "text-amber-600 dark:text-amber-300";

  const bgColor =
    trend === "good"
      ? "bg-emerald-50 dark:bg-emerald-900/20"
      : trend === "bad"
      ? "bg-rose-50 dark:bg-rose-900/10"
      : "bg-amber-50 dark:bg-amber-900/10";

  return (
    <div
      className="rounded-2xl shadow-sm p-6 border transition-transform duration-200 hover:scale-[1.03]"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-700/30 dark:to-purple-700/30">
          <span className="text-3xl">{icon}</span>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${trendColor} ${bgColor}`}
        >
          <span>{isPositive ? "↗" : "↘"}</span>
          <span>{Math.abs(change)}%</span>
        </div>
      </div>

      <div>
        <div className="text-sm mb-1" style={{ color: "var(--muted-text)" }}>
          {title}
        </div>
        <div className="text-3xl font-bold" style={{ color: "var(--chart-text)" }}>
          {value}
        </div>
        <div className="text-xs mt-2" style={{ color: "var(--muted-text)" }}>
          vs last month
        </div>
      </div>
    </div>
  );
}
