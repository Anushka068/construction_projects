import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DelayHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5000/api/predict/delay/history";

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await axios.get(API_URL);
        if (res.data.success) {
          setHistory(res.data.history);
        } else {
          setError("Failed to load delay history");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to reach backend");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const formatDate = (ts) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const riskColor = {
    High: "text-red-500 font-semibold",
    Medium: "text-yellow-500 font-semibold",
    Low: "text-green-500 font-semibold"
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">⏳ Delay Prediction History</h1>

      {loading && <p className="text-gray-400">Loading history...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && history.length === 0 && (
        <p className="text-gray-500">No delay predictions found.</p>
      )}

      {history.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full border border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 border border-gray-700">ID</th>
                <th className="p-2 border border-gray-700">Timestamp</th>
                <th className="p-2 border border-gray-700">Delayed</th>
                <th className="p-2 border border-gray-700">Prob</th>
                <th className="p-2 border border-gray-700">Days</th>
                <th className="p-2 border border-gray-700">Risk</th>
                <th className="p-2 border border-gray-700">Conf</th>
                <th className="p-2 border border-gray-700">District</th>
                <th className="p-2 border border-gray-700">Type</th>
                <th className="p-2 border border-gray-700">Flag</th>
              </tr>
            </thead>

            <tbody className="bg-gray-900 text-gray-200">
              {history.map((row, index) => {
                const isRecent = index === 0; // newest record first from backend
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-800 transition-all"
                  >
                    <td className="p-2 border border-gray-700 text-center">
                      {row.id}
                    </td>

                    <td className="p-2 border border-gray-700">
                      {formatDate(row.created_at)}
                    </td>

                    <td className="p-2 border border-gray-700 text-center">
                      {row.is_delayed ? "Yes" : "No"}
                    </td>

                    <td className="p-2 border border-gray-700 text-center">
                      {(row.delay_probability * 100).toFixed(1)}%
                    </td>

                    <td className="p-2 border border-gray-700 text-center">
                      {row.predicted_delay_days}
                    </td>

                    <td
                      className={`p-2 border border-gray-700 text-center ${riskColor[row.risk_level]}`}
                    >
                      {row.risk_level}
                    </td>

                    <td className="p-2 border border-gray-700 text-center">
                      {row.confidence}
                    </td>

                    <td className="p-2 border border-gray-700 text-center">
                      {row.input_payload?.districttype || "—"}
                    </td>

                    <td className="p-2 border border-gray-700 text-center">
                      {row.input_payload?.final_project_type || "—"}
                    </td>

                    <td className="p-2 border border-gray-700 text-center">
                      {isRecent ? (
                        <span className="px-2 py-1 bg-purple-600 text-white rounded text-sm">
                          NEW
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Old</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
