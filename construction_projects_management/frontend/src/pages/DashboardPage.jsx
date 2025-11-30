import { useEffect, useState } from "react";
import axios from "axios";
import { useLoading } from "../hooks/useLoading";
import SkeletonCard from "../components/ui/SkeletonCard";
import ChartSkeleton from "../components/ui/ChartSkeleton";

// Charts and components
import MetricCard from "../components/MetricCard";
import DelayPredictionChart from "../components/charts/DelayPredictionChart";
import PredictionSummary from "../components/PredictionSummary";
import CostOverrunChart from "../components/charts/CostOverrunChart";
import AIInsights from "../components/AIInsights";
import RiskDashboard from "../components/charts/RiskDashboard";
import RiskTrendChart from "../components/charts/RiskTrendChart";
import PerformanceRadar from "../components/charts/PerformanceRadar";

export default function DashboardPage() {
  const loading = useLoading();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get("http://localhost:5000/api/predict/delay/stats");
        setStats(res.data.stats);
      } catch (err) {
        console.log("Dashboard stats error", err);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-8 transition-colors duration-300">
      
      {/* METRIC CARDS */}
      <div className="grid grid-cols-4 gap-6">
        {loading || !stats ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard title="Total Predictions"
              value={stats.total_predictions}
              change={5}
              icon="📊"
              trend="good"
            />
            <MetricCard title="On-Time Projects"
              value={stats.on_time_count}
              change={3}
              icon="⏳"
              trend="good"
            />
            <MetricCard title="Delayed Projects"
              value={stats.delayed_count}
              change={-2}
              icon="⚠️"
              trend="bad"
            />
            <MetricCard title="Avg Delay Probability"
              value={(stats.avg_delay_probability * 100).toFixed(1) + "%"}
              change={stats.avg_delay_probability > 0.3 ? 4 : -3}
              icon="📉"
              trend={stats.avg_delay_probability > 0.3 ? "bad" : "good"}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          {loading ? <ChartSkeleton /> : <DelayPredictionChart />}
        </div>

        <div className="col-span-4">
          {loading ? <ChartSkeleton /> : <PredictionSummary />}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          {loading ? <ChartSkeleton /> : <CostOverrunChart />}
        </div>
        <div className="col-span-4">
          {loading ? <ChartSkeleton /> : <AIInsights />}
        </div>
      </div>

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
