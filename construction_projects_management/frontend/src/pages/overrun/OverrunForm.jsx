import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const defaultState = {
  final_project_cost: "",
  totalincurredcost: "",
  totallandcost: "",
  totalsellingamount: "",
  totalpayableamountgovernment: "",
  totaldevelopcost: "",
  totalreceivedamount: "",
  bookedsellingamount: "",
  bookedunits: "",
  totalunits: "",
  progress_ratio: "0.5",
  land_utilization: "0.8",
  planned_duration_days: "",
  avg_temp: "28",
  total_rain: "50",
  totalsquarefootbuild: "",
  final_project_type: "Residential/Group Housing",
  promotertype: "COMPANY",
  districttype: "Ahmedabad"
};

export default function OverrunForm() {
  const [formData, setFormData] = useState(defaultState);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const numberOrDefault = (value, fallback) => {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return typeof fallback === "function" ? fallback() : fallback;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!formData.final_project_cost || !formData.totalunits || !formData.planned_duration_days) {
        alert("Please fill required fields (cost, units, duration)");
        setLoading(false);
        return;
      }

      const finalCost = numberOrDefault(formData.final_project_cost, 0);
      const totalUnits = numberOrDefault(formData.totalunits, 0);
      const totalSelling = numberOrDefault(
        formData.totalsellingamount,
        () => finalCost * 1.2
      );

      const payload = {
        final_project_cost: finalCost,
        totalincurredcost: numberOrDefault(
          formData.totalincurredcost,
          () => finalCost * 0.65
        ),
        totallandcost: numberOrDefault(formData.totallandcost, () => finalCost * 0.2),
        totalsellingamount: totalSelling,
        totalpayableamountgovernment: numberOrDefault(
          formData.totalpayableamountgovernment,
          0
        ),
        totaldevelopcost: numberOrDefault(
          formData.totaldevelopcost,
          () => finalCost * 0.4
        ),
        totalreceivedamount: numberOrDefault(
          formData.totalreceivedamount,
          () => totalSelling * 0.45
        ),
        bookedsellingamount: numberOrDefault(
          formData.bookedsellingamount,
          () => totalSelling * 0.7
        ),
        bookedunits: numberOrDefault(
          formData.bookedunits,
          () => totalUnits * 0.6
        ),
        totalunits: totalUnits,
        progress_ratio: numberOrDefault(formData.progress_ratio, 0.5),
        land_utilization: numberOrDefault(formData.land_utilization, 0.8),
        planned_duration_days: numberOrDefault(
          formData.planned_duration_days,
          365
        ),
        avg_temp: numberOrDefault(formData.avg_temp, 28),
        total_rain: numberOrDefault(formData.total_rain, 50),
        totalsquarefootbuild: numberOrDefault(
          formData.totalsquarefootbuild,
          () => totalUnits * 1000
        ),
        final_project_type: formData.final_project_type,
        promotertype: formData.promotertype,
        districttype: formData.districttype
      };

      const response = await fetch("http://localhost:5000/api/predict/cost-overrun", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Prediction failed");
      }

      navigate("/overrun/result", {
        state: {
          prediction: data.prediction,
          inputData: payload
        }
      });
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to fetch prediction. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const renderNumberInput = (name, label, placeholder, required = false) => (
    <div>
      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="number"
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <p className="text-sm uppercase text-indigo-500 font-bold tracking-wide">Real-Time Insights</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            Cost Overrun Prediction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Combine financial, progress, and environmental signals to estimate cost overrun risk instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <span className="font-semibold">Project Overview</span>
              <span className="text-sm text-gray-500">(required)</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {renderNumberInput("final_project_cost", "Final Project Cost (₹)", "50000000", true)}
              {renderNumberInput("totalunits", "Total Units", "500", true)}
              {renderNumberInput("bookedunits", "Booked Units", "300")}
              {renderNumberInput("planned_duration_days", "Planned Duration (days)", "900", true)}
              {renderNumberInput("progress_ratio", "Progress Ratio (0-1)", "0.55")}
              {renderNumberInput("land_utilization", "Land Utilization (0-1)", "0.85")}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  Project Type
                </label>
                <select
                  name="final_project_type"
                  value={formData.final_project_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option>Residential/Group Housing</option>
                  <option>Commercial</option>
                  <option>Mixed Development</option>
                  <option>Plotted Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  Promoter Type
                </label>
                <select
                  name="promotertype"
                  value={formData.promotertype}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option>COMPANY</option>
                  <option>PARTNERSHIP FIRM</option>
                  <option>LIMITED LIABILITY PARTNERSHIP FIRM</option>
                  <option>COMPETENT AUTHORITY/ GOVERNMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  District
                </label>
                <select
                  name="districttype"
                  value={formData.districttype}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option>Ahmedabad</option>
                  <option>Surat</option>
                  <option>Vadodara</option>
                  <option>Rajkot</option>
                  <option>Gandhinagar</option>
                  <option>Mehsana</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <span className="font-semibold">Financial Snapshot</span>
              <span className="text-sm text-gray-500">defaults applied if left blank</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {renderNumberInput("totalincurredcost", "Total Incurred Cost (₹)", "32000000")}
              {renderNumberInput("totallandcost", "Total Land Cost (₹)", "8000000")}
              {renderNumberInput("totalsellingamount", "Total Selling Amount (₹)", "60000000")}
              {renderNumberInput("totalpayableamountgovernment", "Govt. Payables (₹)", "2500000")}
              {renderNumberInput("totaldevelopcost", "Development Cost (₹)", "20000000")}
              {renderNumberInput("totalreceivedamount", "Collections Received (₹)", "12000000")}
              {renderNumberInput("bookedsellingamount", "Booked Revenue (₹)", "18000000")}
              {renderNumberInput("totalsquarefootbuild", "Total Built-up (sqft)", "450000")}
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <span className="font-semibold">Environmental Factors</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {renderNumberInput("avg_temp", "Average Temperature (°C)", "28")}
              {renderNumberInput("total_rain", "Annual Rainfall (mm)", "1200")}
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Evaluating cost risk...
              </>
            ) : (
              <>
                Run Prediction
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
