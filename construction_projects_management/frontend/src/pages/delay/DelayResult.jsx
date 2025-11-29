import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

export default function DelayResult() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state || !state.prediction) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 dark:text-gray-400">No prediction data available.</p>
        <button
          onClick={() => navigate('/delay/form')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl"
        >
          Go to Form
        </button>
      </div>
    );
  }

  const { prediction, recommendations } = state;
  const isHighRisk = prediction.risk_level === 'High';
  const isMediumRisk = prediction.risk_level === 'Medium';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/delay/form')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Form
      </button>

      {/* Main Result Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Prediction Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI-powered delay analysis completed
            </p>
          </div>

          {/* Risk Badge */}
          <div className={`px-6 py-3 rounded-xl font-bold text-lg ${
            isHighRisk 
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : isMediumRisk
              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          }`}>
            {prediction.risk_level} Risk
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Delay Status */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 text-center">
            {prediction.is_delayed ? (
              <AlertCircle size={40} className="mx-auto mb-3 text-red-500" />
            ) : (
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
            )}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delay Status</div>
            <div className="text-2xl font-bold">
              {prediction.is_delayed ? 'Delayed' : 'On Time'}
            </div>
          </div>

          {/* Probability */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 text-center">
            <TrendingUp size={40} className="mx-auto mb-3 text-indigo-500" />
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delay Probability</div>
            <div className="text-2xl font-bold">
              {(prediction.delay_probability * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Confidence: {prediction.confidence}
            </div>
          </div>

          {/* Predicted Days */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 text-center">
            <span className="text-4xl mb-3 block">📅</span>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Predicted Delay</div>
            <div className="text-2xl font-bold">
              {prediction.predicted_delay_days} days
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {prediction.predicted_delay_days === 0 ? 'No delay expected' : 'Estimated delay duration'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
            <span className="font-semibold">{(prediction.delay_probability * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                isHighRisk ? 'bg-red-500' : isMediumRisk ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${prediction.delay_probability * 100}%` }}
            />
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎯</span>
            AI Recommendations
          </h3>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                <span className="text-gray-700 dark:text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-semibold mb-4">Understanding Your Results</h3>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Risk Level:</strong>
            <p className="mt-1">
              {isHighRisk && "High risk indicates >60% probability of delay. Immediate intervention recommended."}
              {isMediumRisk && "Medium risk indicates 30-60% probability. Enhanced monitoring advised."}
              {!isHighRisk && !isMediumRisk && "Low risk indicates <30% probability. Normal monitoring sufficient."}
            </p>
          </div>

          <div>
            <strong className="text-gray-900 dark:text-gray-100">Model Accuracy:</strong>
            <p className="mt-1">
              This prediction is based on analysis of 3,500+ historical projects with 82.8% accuracy.
              The model correctly identifies 64% of delayed projects.
            </p>
          </div>

          <div>
            <strong className="text-gray-900 dark:text-gray-100">Next Steps:</strong>
            <p className="mt-1">
              Save this prediction to your dashboard and set up monitoring alerts.
              Review the recommendations with your project team.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/delay/form')}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            New Prediction
          </button>
          <button
            onClick={() => navigate('/delay/history')}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
}