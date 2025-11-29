// src/pages/Dashboard.jsx
import React from "react";
import MetricCard from "../components/MetricCard";
import DelayPredictionChart from "../components/charts/DelayPredictionChart";
import PredictionSummary from "../components/PredictionSummary";
import CostOverrunChart from "../components/charts/CostOverrunChart";
import AIInsights from "../components/AIInsights";
import RiskDashboard from "../components/charts/RiskDashboard";
import RiskTrendChart from "../components/charts/RiskTrendChart";
import PerformanceRadar from "../components/charts/PerformanceRadar";

export default function Dashboard() {
  return (
    <div>
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <MetricCard title="Tasks Completed" value="27" change={-12} icon="✅" trend="bad" />
        <MetricCard title="New Tasks" value="45" change={8} icon="🆕" trend="good" />
        <MetricCard title="On Track" value="61%" change={8} icon="📈" trend="good" />
        <MetricCard title="Budget Used" value="78%" change={5} icon="💰" trend="warn" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-8"><DelayPredictionChart /></div>
        <div className="col-span-4"><PredictionSummary /></div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-8"><CostOverrunChart /></div>
        <div className="col-span-4"><AIInsights /></div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5"><RiskDashboard /></div>
        <div className="col-span-4"><RiskTrendChart /></div>
        <div className="col-span-3"><PerformanceRadar /></div>
      </div>
    </div>
  );
}
