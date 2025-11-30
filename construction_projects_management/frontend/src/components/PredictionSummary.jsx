import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PredictionSummary() {
  const [last, setLast] = useState(null);

  useEffect(() => {
    async function loadLatest() {
      const res = await axios.get("http://localhost:5000/api/predict/delay/history?limit=1");
      setLast(res.data.history[0]);
    }
    loadLatest();
  }, []);

  if (!last) return null;

  return (
    <div className="rounded-2xl shadow-lg p-6"
      style={{
        background: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
        color: "white"
      }}
    >
      <h3 className="text-xl font-bold mb-4">Latest Prediction</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded-xl">
          <div className="text-indigo-200 text-xs">Delay Probability</div>
          <div className="text-4xl font-bold">
            {(last.delay_probability * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-xl">
          <div className="text-indigo-200 text-xs">Predicted Delay</div>
          <div className="text-4xl font-bold">{last.predicted_delay_days} days</div>
        </div>
      </div>

      <div className="bg-white/10 p-4 rounded-xl">
        <div className="text-sm font-semibold">Recommendation</div>
        <ul className="text-sm mt-2">
          {last.recommendations.slice(0, 3).map((rec, i) => (
            <li key={i}>• {rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
