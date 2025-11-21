import React from "react";
import { useLocation } from "react-router-dom";

export default function OverrunResult() {
  const { state } = useLocation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Overrun Result</h1>

      <p className="text-lg">
        Estimated Cost: <b>${state?.cost || "Unknown"}</b>
      </p>

      <p className="mt-3 text-gray-600">
        Predicted Overrun: <b>$42,000</b>
      </p>
    </div>
  );
}
