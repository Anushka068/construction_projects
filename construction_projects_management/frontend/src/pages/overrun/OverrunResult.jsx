import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Cell
} from "recharts";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function OverrunResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const prediction = state?.prediction;
  const inputData = state?.inputData;

  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [scenarioForm, setScenarioForm] = useState({
    name: "Material +5%",
    final_project_cost: "",
    progress_ratio: "",
    totalincurredcost: "",
    totalsellingamount: ""
  });
  const [scenarioResults, setScenarioResults] = useState([]);
  const [runningScenario, setRunningScenario] = useState(false);

  useEffect(() => {
    if (!prediction) {
      navigate("/overrun/form", { replace: true });
    }
  }, [prediction, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("http://localhost:5000/api/predict/cost-overrun/history?limit=5");
        const data = await response.json();
        if (data.success) {
          setHistory(data.history);
        } else {
          setHistoryError(data.error || "Unable to load history");
        }
      } catch (error) {
        setHistoryError("Unable to connect to backend for history");
      }
    })();
  }, []);

  const summary = useMemo(() => {
    if (!prediction) return null;
    const percent = prediction.expected_overrun_percent || 0;
    const finalCost = prediction.predicted_final_cost || 0;
    const totalCost = inputData?.final_project_cost || 0;
    const risk = prediction.risk_level || "Unknown";
    return {
      percent: percent.toFixed(2),
      finalCost: currency.format(finalCost),
      totalCost: currency.format(totalCost),
      risk,
      intervals: prediction.intervals,
      costIntervals: prediction.cost_intervals
    };
  }, [prediction, inputData]);

  const progressRatio = Number(inputData?.progress_ratio ?? 0);
  const collectionAmount = currency.format(inputData?.totalreceivedamount || 0);

  const metricCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "Projected Overrun %",
        value: `${summary.percent}%`,
        trend:
          typeof prediction.intervals?.expected === "number"
            ? `${prediction.intervals.expected.toFixed(1)}% median`
            : `${summary.percent}% median`,
        accent: "from-indigo-500 to-purple-500"
      },
      {
        label: "Predicted Final Cost",
        value: summary.finalCost,
        trend: summary.totalCost,
        accent: "from-amber-500 to-orange-500"
      },
      {
        label: "Risk Level",
        value: summary.risk,
        trend: `${prediction.alerts?.length || 0} alerts`,
        accent: "from-rose-500 to-pink-500"
      },
      {
        label: "Progress Ratio",
        value: progressRatio.toFixed(2),
        trend: `Collections ${collectionAmount}`,
        accent: "from-emerald-500 to-teal-500"
      }
    ];
  }, [summary, prediction, progressRatio, collectionAmount]);

  const intervalChartData = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "P10", value: summary.intervals.p10, rupees: summary.costIntervals.p10 },
      { label: "P50", value: summary.intervals.expected, rupees: summary.costIntervals.expected },
      { label: "P90", value: summary.intervals.p90, rupees: summary.costIntervals.p90 }
    ];
  }, [summary]);

  const contributorChartData = useMemo(() => {
    return (prediction.top_contributors || []).map((item) => ({
      feature: item.feature,
      impact: item.impact * (item.direction === "positive" ? 1 : -1)
    }));
  }, [prediction.top_contributors]);

  const historyChartData = useMemo(() => {
    return history
      .map((entry) => ({
        date: new Date(entry.created_at).toLocaleDateString(),
        percent: entry.output_payload?.expected_overrun_percent ?? null,
        risk: entry.risk_level
      }))
      .filter((item) => item.percent !== null)
      .reverse();
  }, [history]);

  const handleScenarioChange = (event) => {
    const { name, value } = event.target;
    setScenarioForm((prev) => ({ ...prev, [name]: value }));
  };

  const runScenario = async () => {
    if (!inputData) return;
    setRunningScenario(true);
    const overrides = {};

    ["final_project_cost", "progress_ratio", "totalincurredcost", "totalsellingamount"].forEach((field) => {
      if (scenarioForm[field]) {
        overrides[field] = Number(scenarioForm[field]);
      }
    });

    try {
      const response = await fetch("http://localhost:5000/api/predict/cost-overrun/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_project: inputData,
          scenarios: [{ name: scenarioForm.name || "Scenario", overrides }]
        })
      });
      const data = await response.json();
      if (data.success) {
        setScenarioResults(data.simulations || []);
      } else {
        alert(data.error || "Scenario failed");
      }
    } catch (error) {
      alert("Unable to reach backend for scenario simulation.");
    } finally {
      setRunningScenario(false);
    }
  };

  if (!prediction) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Cost Intelligence</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              Real-time Cost Overrun Assessment
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Based on project size, financial exposure, progress signals, and regional context.
            </p>
          </div>
          <button
            onClick={() => navigate("/overrun/form")}
            className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50"
          >
            Run another forecast
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className={`p-4 rounded-2xl text-white shadow-lg bg-gradient-to-br ${card.accent}`}
            >
              <p className="text-sm uppercase tracking-wide opacity-80">{card.label}</p>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
              <p className="text-xs mt-1 opacity-80">{card.trend}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Confidence Ranges
              </h2>
              <span className="text-sm text-gray-500">Percent vs INR</span>
            </div>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={intervalChartData}>
                  <defs>
                    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#C084FC" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value, name, props) => [`${value.toFixed(2)}%`, props.payload.rupees ? currency.format(props.payload.rupees) : name]} />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" fill="url(#band)" />
                  <Line type="monotone" dataKey="value" stroke="#312E81" dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currency.format(summary.costIntervals.p10)} ↔ {currency.format(summary.costIntervals.p90)} expected rupee range.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Key Recommendations</h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              {(prediction.recommendations || []).map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white dark:bg-gray-900/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Top Contributors (SHAP)</h3>
            {contributorChartData.length ? (
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={contributorChartData} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="2 3" stroke="#e5e7eb" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="feature" width={140} />
                    <Tooltip formatter={(value) => `${value.toFixed(3)}`} />
                    <Bar dataKey="impact">
                      {contributorChartData.map((entry) => (
                        <Cell
                          key={`cell-${entry.feature}`}
                          fill={entry.impact >= 0 ? "#DC2626" : "#16A34A"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No explainability data available.</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-900/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Input Snapshot</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <p className="text-gray-500">Project Cost</p>
                <p className="font-semibold">{summary.totalCost}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Units</p>
                <p className="font-semibold">{inputData?.totalunits}</p>
              </div>
              <div>
                <p className="text-gray-500">Progress Ratio</p>
                <p className="font-semibold">{progressRatio.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Collections</p>
                <p className="font-semibold">{collectionAmount}</p>
              </div>
            </div>
          </div>
        </div>

        {!!prediction.alerts?.length && (
          <div className="mt-6 bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">Alerts</h3>
            <ul className="list-disc pl-5 text-amber-800 dark:text-amber-100 space-y-1">
              {prediction.alerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">What-if Scenario Simulator</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-500 font-semibold mb-1">Scenario Name</label>
            <input
              name="name"
              value={scenarioForm.name}
              onChange={handleScenarioChange}
              className="w-full px-4 py-2 border rounded-xl"
              placeholder="e.g. Contractor delay +10%"
            />
          </div>
          {["final_project_cost", "progress_ratio", "totalincurredcost", "totalsellingamount"].map((field) => (
            <div key={field}>
              <label className="block text-sm text-gray-500 font-semibold mb-1 capitalize">{field.replace(/_/g, " ")}</label>
              <input
                type="number"
                name={field}
                value={scenarioForm[field]}
                onChange={handleScenarioChange}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="Override value"
              />
            </div>
          ))}
        </div>
        <button
          onClick={runScenario}
          disabled={runningScenario}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
        >
          {runningScenario ? "Running..." : "Run Scenario"}
        </button>

        {!!scenarioResults.length && (
          <div className="mt-6 space-y-3">
            {scenarioResults.map((scenario) => {
              const delta =
                scenario.prediction.expected_overrun_percent - prediction.expected_overrun_percent;
              return (
                <div key={scenario.scenario} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{scenario.scenario}</p>
                      <p className="text-sm text-gray-500">Overrides: {Object.keys(scenario.overrides).length || "None"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">
                        {scenario.prediction.expected_overrun_percent.toFixed(2)}%
                      </p>
                      <p className={`text-sm ${delta >= 0 ? "text-red-500" : "text-green-500"}`}>
                        {delta >= 0 ? "+" : "-"}
                        {Math.abs(delta).toFixed(2)}% vs base
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Predicted cost: {currency.format(scenario.prediction.predicted_final_cost)} · Risk: {scenario.prediction.risk_level}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recent Predictions</h2>
          {historyError && <p className="text-sm text-red-500">{historyError}</p>}
        </div>
        {historyChartData.length > 1 && (
          <div className="h-64 mb-6">
            <ResponsiveContainer>
              <LineChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="percent" stroke="#7C3AED" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="py-2">Timestamp</th>
                <th className="py-2">Risk</th>
                <th className="py-2">Scenario</th>
                <th className="py-2">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="py-2 font-semibold">{item.risk_level}</td>
                  <td className="py-2">{item.scenario_name || "Base"}</td>
                  <td className="py-2">{(item.alerts || []).join(", ") || "—"}</td>
                </tr>
              ))}
              {!history.length && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
                    No predictions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
