import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function DelayForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    final_project_cost: "",
    totalincurredcost: "",
    totallandcost: "",
    budget_overrun_percent: "",
    progress_ratio: "",
    bookedunits: "",
    totalunits: "",
    land_utilization: "",
    planned_duration_days: "",
    actual_duration_days: "",
    avg_temp: "28",
    total_rain: "50",
    totalsquarefootbuild: "",
    final_project_type: "Residential/Group Housing",
    promotertype: "COMPANY",
    districttype: "Ahmedabad"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert string values to numbers
      const payload = {
        final_project_cost: parseFloat(formData.final_project_cost),
        totalincurredcost: parseFloat(formData.totalincurredcost) || parseFloat(formData.final_project_cost) * 0.6, // Default to 60% of total
        totallandcost: parseFloat(formData.totallandcost) || parseFloat(formData.final_project_cost) * 0.2, // Default to 20%
        budget_overrun_percent: parseFloat(formData.budget_overrun_percent) || 0,
        progress_ratio: parseFloat(formData.progress_ratio) || 0.5,
        bookedunits: parseInt(formData.bookedunits) || parseInt(formData.totalunits) * 0.5, // Default to 50%
        totalunits: parseInt(formData.totalunits),
        land_utilization: parseFloat(formData.land_utilization) || 0.5,
        planned_duration_days: parseInt(formData.planned_duration_days),
        actual_duration_days: parseInt(formData.actual_duration_days) || parseInt(formData.planned_duration_days),
        avg_temp: parseFloat(formData.avg_temp),
        total_rain: parseFloat(formData.total_rain),
        totalsquarefootbuild: parseFloat(formData.totalsquarefootbuild) || parseInt(formData.totalunits) * 1000, // Default estimate
        final_project_type: formData.final_project_type,
        promotertype: formData.promotertype,
        districttype: formData.districttype
      };

      console.log("Sending payload:", payload); // DEBUG: Check what's being sent
      
      const response = await fetch('http://localhost:5000/api/predict/delay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to result page with prediction data
        navigate('/delay/result', { 
          state: { 
            prediction: data.prediction,
            recommendations: data.recommendations,
            inputData: formData
          } 
        });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Failed to get prediction. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Project Delay Prediction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter project details to predict potential delays
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Basic Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Cost (₹) *</label>
                <input
                  type="number"
                  name="final_project_cost"
                  value={formData.final_project_cost}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                  placeholder="50000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Units *</label>
                <input
                  type="number"
                  name="totalunits"
                  value={formData.totalunits}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Planned Duration (days) *</label>
                <input
                  type="number"
                  name="planned_duration_days"
                  value={formData.planned_duration_days}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                  placeholder="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Type *</label>
                <select
                  name="final_project_type"
                  value={formData.final_project_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                >
                  <option>Residential/Group Housing</option>
                  <option>Commercial</option>
                  <option>Mixed Development</option>
                  <option>Plotted Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Promoter Type *</label>
                <select
                  name="promotertype"
                  value={formData.promotertype}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                >
                  <option>COMPANY</option>
                  <option>PARTNERSHIP FIRM</option>
                  <option>LIMITED LIABILITY PARTNERSHIP FIRM</option>
                  <option>COMPETENT AUTHORITY/ GOVERNMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">District *</label>
                <select
                  name="districttype"
                  value={formData.districttype}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                >
                  <option>Ahmedabad</option>
                  <option>Surat</option>
                  <option>Vadodara</option>
                  <option>Rajkot</option>
                  <option>Gandhinagar</option>
                  <option>Bhavnagar</option>
                  <option>Jamnagar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Progress & Financial */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Progress & Financial</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Progress Ratio (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  name="progress_ratio"
                  value={formData.progress_ratio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                  placeholder="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Budget Overrun (%)</label>
                <input
                  type="number"
                  name="budget_overrun_percent"
                  value={formData.budget_overrun_percent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Land Utilization (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  name="land_utilization"
                  value={formData.land_utilization}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                  placeholder="0.8"
                />
              </div>
            </div>
          </div>

          {/* Weather */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Weather Conditions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Avg Temperature (°C)</label>
                <input
                  type="number"
                  name="avg_temp"
                  value={formData.avg_temp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Rainfall (mm)</label>
                <input
                  type="number"
                  name="total_rain"
                  value={formData.total_rain}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg
                     hover:from-indigo-700 hover:to-purple-700 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyzing Project...
              </>
            ) : (
              <>
                <span>🔮</span>
                Predict Delay
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}