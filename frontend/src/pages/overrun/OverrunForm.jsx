import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OverrunForm() {
  const [cost, setCost] = useState("");
  const navigate = useNavigate();

  const submit = () => {
    if (!cost.trim()) return alert("Enter project cost");
    navigate("/overrun/result", { state: { cost: cost } });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cost Overrun Prediction</h1>

      <input
        className="border p-3 rounded-xl w-full"
        placeholder="Enter project cost"
        value={cost}
        onChange={e => setCost(e.target.value)}
      />

      <button
        onClick={submit}
        className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl"
      >
        Predict Overrun
      </button>
    </div>
  );
}
