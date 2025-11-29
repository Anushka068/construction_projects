import React from "react";

export default function PredictionSummary() {
  return (
    <div className="rounded-2xl shadow-lg p-6" style={{
      background: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.06)"
    }}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔮</span>
        <div>
          <h3 className="text-xl font-bold">AI Predictions</h3>
          <p className="text-indigo-200 text-sm">30-day forecast</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="text-indigo-200 text-xs mb-2">Delay Probability</div>
          <div className="text-4xl font-bold">62%</div>
          <div className="text-xs text-indigo-200 mt-2">↑ 8% from last month</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="text-indigo-200 text-xs mb-2">Expected Overrun</div>
          <div className="text-4xl font-bold">$45K</div>
          <div className="text-xs text-indigo-200 mt-2">High confidence: 87%</div>
        </div>
      </div>

      <div className="bg-white/6 backdrop-blur-sm rounded-xl p-4 border border-white/6">
        <div className="text-sm font-semibold mb-3">🎯 Recommendations</div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-300">•</span>
            <span>Reallocate 2x manpower to critical path</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-300">•</span>
            <span>Lock material prices for 4 weeks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-300">•</span>
            <span>Review Sabarkantha Bridge timeline</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
