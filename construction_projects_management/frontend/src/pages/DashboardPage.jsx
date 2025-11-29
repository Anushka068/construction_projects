// src/pages/DashboardPage.jsx
import { useLoading } from "../hooks/useLoading";
import SkeletonCard from "../components/ui/SkeletonCard";
import ChartSkeleton from "../components/ui/ChartSkeleton";

// Import real dashboard components
import MetricCard from "../components/MetricCard";
import DelayPredictionChart from "../components/charts/DelayPredictionChart";
import PredictionSummary from "../components/PredictionSummary";
import CostOverrunChart from "../components/charts/CostOverrunChart";
import AIInsights from "../components/AIInsights";
import RiskDashboard from "../components/charts/RiskDashboard";
import RiskTrendChart from "../components/charts/RiskTrendChart";
import PerformanceRadar from "../components/charts/PerformanceRadar";

export default function DashboardPage() {
  const loading = useLoading(); // Auto true → false after delay

  return (
    <div
      className="
        space-y-8 
        transition-colors duration-300
        text-gray-900 dark:text-gray-100
      "
      style={{ color: "var(--chart-text)" }}
    >
      {/* ---------- METRIC CARDS ---------- */}
      <div className="grid grid-cols-4 gap-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard title="Tasks Completed" value="27" change={-12} icon="✅" trend="bad" />
            <MetricCard title="New Tasks" value="45" change={8} icon="🆕" trend="good" />
            <MetricCard title="On Track" value="61%" change={8} icon="📈" trend="good" />
            <MetricCard title="Budget Used" value="78%" change={5} icon="💰" trend="warn" />
          </>
        )}
      </div>

      {/* ---------- FIRST CHART SECTION ---------- */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          {loading ? <ChartSkeleton /> : <DelayPredictionChart />}
        </div>

        <div className="col-span-4">
          {loading ? <ChartSkeleton /> : <PredictionSummary />}
        </div>
      </div>

      {/* ---------- SECOND CHART SECTION ---------- */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          {loading ? <ChartSkeleton /> : <CostOverrunChart />}
        </div>

        <div className="col-span-4">
          {loading ? <ChartSkeleton /> : <AIInsights />}
        </div>
      </div>

      {/* ---------- THIRD CHART SECTION ---------- */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5">
          {loading ? <ChartSkeleton /> : <RiskDashboard />}
        </div>

        <div className="col-span-4">
          {loading ? <ChartSkeleton /> : <RiskTrendChart />}
        </div>

        <div className="col-span-3">
          {loading ? <ChartSkeleton /> : <PerformanceRadar />}
        </div>
      </div>
    </div>
  );
}
