// src/data/dashboardData.js
export const trendData = [
  { month: "Jan", delay: 85, cost: 200, predicted: 210 },
  { month: "Feb", delay: 82, cost: 240, predicted: 245 },
  { month: "Mar", delay: 80, cost: 260, predicted: 270 },
  { month: "Apr", delay: 75, cost: 330, predicted: 340 },
  { month: "May", delay: 78, cost: 300, predicted: 315 },
  { month: "Jun", delay: 80, cost: 340, predicted: 350 },
];

export const riskTrendData = [
  { month: "Jan", high: 2, medium: 5, low: 8 },
  { month: "Feb", high: 3, medium: 4, low: 7 },
  { month: "Mar", high: 2, medium: 6, low: 6 },
  { month: "Apr", high: 4, medium: 5, low: 5 },
  { month: "May", high: 3, medium: 6, low: 6 },
  { month: "Jun", high: 2, medium: 5, low: 7 },
];

export const projectPerformance = [
  { metric: "Schedule", value: 75 },
  { metric: "Budget", value: 82 },
  { metric: "Quality", value: 88 },
  { metric: "Resources", value: 70 },
  { metric: "Risk", value: 65 },
];

export const riskProjects = [
  { id: 1, name: "Sabarkantha Bridge", score: 78, status: "High", progress: 65, delay: 12, budget: 340 },
  { id: 2, name: "Ahmedabad Commercial", score: 42, status: "Moderate", progress: 80, delay: 5, budget: 280 },
  { id: 3, name: "Vadodara Road Extension", score: 18, status: "Low", progress: 92, delay: 2, budget: 150 },
  { id: 4, name: "Surat Metro Phase 2", score: 65, status: "High", progress: 45, delay: 18, budget: 520 },
];

export const insights = [
  { type: "warning", title: "Critical Path Risk", message: "Sabarkantha Bridge project showing 78% delay probability", time: "5m ago" },
  { type: "success", title: "Cost Optimization", message: "Material price lock saved $12K on Vadodara project", time: "1h ago" },
  { type: "alert", title: "Resource Alert", message: "Manpower shortage detected in 2 high-risk projects", time: "3h ago" },
];

// Mock data for delay prediction pages (so UI can work without backend)
export const mockDelayInput = {
  project_cost: 1200000,
  total_units: 120,
  planned_duration_days: 365,
  progress_ratio: 0.55,
  avg_temp: 30,
  total_rain: 45,
  district: "Ahmedabad",
  promoter_type: "Private",
  final_project_type: "Commercial",
};

export const mockDelayResult = {
  probability: 0.62,
  delayed: true,
  predicted_days: 78,
  predicted_days_ci: [45, 120],
  top_features: [
    { name: "budget_overrun_percent", importance: 0.21 },
    { name: "progress_ratio", importance: 0.18 },
    { name: "planned_duration_days", importance: 0.12 },
  ],
};

// Mock data for overrun module
export const mockOverrunInput = {
  estimated_cost: 900000,
  actual_incurred: 980000,
  planned_duration_days: 300,
  current_progress: 0.6,
};

export const mockOverrunResult = {
  overrun_percent: 8.9,
  is_overrun: true,
  confidence: 0.87,
};
