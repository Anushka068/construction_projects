import React, { useState, useRef, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle, TrendingUp, X } from "lucide-react";

// Field definitions for both models
const DELAY_REQUIRED_FIELDS = [
  { key: "final_project_cost", label: "Final Project Cost (₹)", type: "number", placeholder: "e.g., 50000000" },
  { key: "totalunits", label: "Total Units", type: "number", placeholder: "e.g., 100" },
  { key: "planned_duration_days", label: "Planned Duration (days)", type: "number", placeholder: "e.g., 365" },
  { key: "final_project_type", label: "Project Type", type: "select", options: ["Residential/Group Housing", "Commercial", "Mixed Development", "Plotted Development"] },
  { key: "promotertype", label: "Promoter Type", type: "select", options: ["COMPANY", "PARTNERSHIP FIRM", "LIMITED LIABILITY PARTNERSHIP FIRM", "COMPETENT AUTHORITY/ GOVERNMENT"] },
  { key: "districttype", label: "District", type: "select", options: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar"] }
];

const DELAY_OPTIONAL_FIELDS = [
  { key: "totalincurredcost", label: "Total Incurred Cost (₹)", type: "number", placeholder: "e.g., 30000000" },
  { key: "totallandcost", label: "Total Land Cost (₹)", type: "number", placeholder: "e.g., 10000000" },
  { key: "budget_overrun_percent", label: "Budget Overrun (%)", type: "number", placeholder: "e.g., 10" },
  { key: "progress_ratio", label: "Progress Ratio (0-1)", type: "number", step: "0.01", placeholder: "e.g., 0.6" },
  { key: "bookedunits", label: "Booked Units", type: "number", placeholder: "e.g., 50" },
  { key: "land_utilization", label: "Land Utilization (0-1)", type: "number", step: "0.01", placeholder: "e.g., 0.8" },
  { key: "actual_duration_days", label: "Actual Duration (days)", type: "number", placeholder: "e.g., 365" },
  { key: "avg_temp", label: "Average Temperature (°C)", type: "number", placeholder: "e.g., 28" },
  { key: "total_rain", label: "Total Rainfall (mm)", type: "number", placeholder: "e.g., 50" },
  { key: "totalsquarefootbuild", label: "Total Square Foot Build", type: "number", placeholder: "e.g., 50000" }
];

const COST_OVERRUN_REQUIRED_FIELDS = [
  { key: "final_project_cost", label: "Final Project Cost (₹)", type: "number", placeholder: "e.g., 50000000" },
  { key: "totalunits", label: "Total Units", type: "number", placeholder: "e.g., 100" },
  { key: "planned_duration_days", label: "Planned Duration (days)", type: "number", placeholder: "e.g., 365" },
  { key: "final_project_type", label: "Project Type", type: "select", options: ["Residential/Group Housing", "Commercial", "Mixed Development", "Plotted Development"] },
  { key: "promotertype", label: "Promoter Type", type: "select", options: ["COMPANY", "PARTNERSHIP FIRM", "LIMITED LIABILITY PARTNERSHIP FIRM", "COMPETENT AUTHORITY/ GOVERNMENT"] },
  { key: "districttype", label: "District", type: "select", options: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar"] }
];

const COST_OVERRUN_OPTIONAL_FIELDS = [
  { key: "totalincurredcost", label: "Total Incurred Cost (₹)", type: "number", placeholder: "e.g., 30000000" },
  { key: "totallandcost", label: "Total Land Cost (₹)", type: "number", placeholder: "e.g., 10000000" },
  { key: "totalsellingamount", label: "Total Selling Amount (₹)", type: "number", placeholder: "e.g., 60000000" },
  { key: "totalpayableamountgovernment", label: "Government Payables (₹)", type: "number", placeholder: "e.g., 2500000" },
  { key: "totaldevelopcost", label: "Development Cost (₹)", type: "number", placeholder: "e.g., 20000000" },
  { key: "totalreceivedamount", label: "Collections Received (₹)", type: "number", placeholder: "e.g., 12000000" },
  { key: "bookedsellingamount", label: "Booked Revenue (₹)", type: "number", placeholder: "e.g., 18000000" },
  { key: "bookedunits", label: "Booked Units", type: "number", placeholder: "e.g., 60" },
  { key: "progress_ratio", label: "Progress Ratio (0-1)", type: "number", step: "0.01", placeholder: "e.g., 0.5" },
  { key: "land_utilization", label: "Land Utilization (0-1)", type: "number", step: "0.01", placeholder: "e.g., 0.8" },
  { key: "avg_temp", label: "Average Temperature (°C)", type: "number", placeholder: "e.g., 28" },
  { key: "total_rain", label: "Total Rainfall (mm)", type: "number", placeholder: "e.g., 50" },
  { key: "totalsquarefootbuild", label: "Total Square Foot Build", type: "number", placeholder: "e.g., 450000" }
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "Hi! I'm your construction project assistant. I can help you predict **Delay** or **Cost Overrun** for your projects. What would you like to know?",
      type: "text"
    }
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(null); // "delay" or "cost_overrun"
  const [collectedData, setCollectedData] = useState({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isCollectingFields, setIsCollectingFields] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role, text, type = "text") => {
    setMessages(prev => [...prev, { role, text, type }]);
  };

  const detectIntent = (text) => {
    const lowerText = text.toLowerCase();
    const delayKeywords = ["delay", "late", "time", "schedule", "timeline", "duration", "on time"];
    const costKeywords = ["cost", "overrun", "budget", "expense", "spending", "financial"];
    
    const delayMatches = delayKeywords.filter(kw => lowerText.includes(kw)).length;
    const costMatches = costKeywords.filter(kw => lowerText.includes(kw)).length;
    
    if (delayMatches > costMatches && delayMatches > 0) {
      return "delay";
    }
    if (costMatches > delayMatches && costMatches > 0) {
      return "cost_overrun";
    }
    return null;
  };

  const getFieldLabel = (field) => {
    return field.label;
  };

  const startFieldCollection = (predictionMode) => {
    setMode(predictionMode);
    setCollectedData({});
    setCurrentFieldIndex(0);
    setIsCollectingFields(true);
    
    const requiredFields = predictionMode === "delay" ? DELAY_REQUIRED_FIELDS : COST_OVERRUN_REQUIRED_FIELDS;
    const firstField = requiredFields[0];
    
    addMessage("ai", `Great! I'll help you predict ${predictionMode === "delay" ? "project delay" : "cost overrun"}. Let me collect the required information.\n\n**${getFieldLabel(firstField)}**${firstField.type === "select" ? `\nOptions: ${firstField.options.join(", ")}` : ""}\n\nPlease provide this information:`, "text");
  };

  const processFieldValue = (field, value) => {
    if (field.type === "number") {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return value.trim();
  };

  const collectField = (value) => {
    if (!mode) return;

    const requiredFields = mode === "delay" ? DELAY_REQUIRED_FIELDS : COST_OVERRUN_REQUIRED_FIELDS;
    const currentField = requiredFields[currentFieldIndex];
    
    const processedValue = processFieldValue(currentField, value);
    
    if (processedValue === null || processedValue === "") {
      addMessage("ai", `Please provide a valid value for ${getFieldLabel(currentField)}.`, "text");
      return;
    }

    setCollectedData(prev => ({ ...prev, [currentField.key]: processedValue }));
    
    // Move to next field
    if (currentFieldIndex < requiredFields.length - 1) {
      const nextField = requiredFields[currentFieldIndex + 1];
      setCurrentFieldIndex(prev => prev + 1);
      addMessage("ai", `Got it! Now, please provide **${getFieldLabel(nextField)}**${nextField.type === "select" ? `\nOptions: ${nextField.options.join(", ")}` : ""}:`, "text");
    } else {
      // All required fields collected
      setIsCollectingFields(false);
      addMessage("ai", "Perfect! I have all the required information. Would you like to provide any optional details, or should I proceed with the prediction using default values for optional fields?\n\nType 'proceed' to continue or provide optional field values.", "text");
    }
  };

  const buildPayload = () => {
    const payload = { ...collectedData };
    
    // Apply defaults for optional fields if not provided
    if (mode === "delay") {
      if (!payload.totalincurredcost && payload.final_project_cost) {
        payload.totalincurredcost = payload.final_project_cost * 0.6;
      }
      if (!payload.totallandcost && payload.final_project_cost) {
        payload.totallandcost = payload.final_project_cost * 0.2;
      }
      if (!payload.progress_ratio) payload.progress_ratio = 0.5;
      if (!payload.bookedunits && payload.totalunits) {
        payload.bookedunits = Math.floor(payload.totalunits * 0.5);
      }
      if (!payload.land_utilization) payload.land_utilization = 0.5;
      if (!payload.actual_duration_days && payload.planned_duration_days) {
        payload.actual_duration_days = payload.planned_duration_days;
      }
      if (!payload.avg_temp) payload.avg_temp = 28;
      if (!payload.total_rain) payload.total_rain = 50;
      if (!payload.totalsquarefootbuild && payload.totalunits) {
        payload.totalsquarefootbuild = payload.totalunits * 1000;
      }
    } else {
      // Cost overrun defaults
      if (!payload.totalincurredcost && payload.final_project_cost) {
        payload.totalincurredcost = payload.final_project_cost * 0.65;
      }
      if (!payload.totallandcost && payload.final_project_cost) {
        payload.totallandcost = payload.final_project_cost * 0.2;
      }
      if (!payload.totalsellingamount && payload.final_project_cost) {
        payload.totalsellingamount = payload.final_project_cost * 1.2;
      }
      if (!payload.totaldevelopcost && payload.final_project_cost) {
        payload.totaldevelopcost = payload.final_project_cost * 0.4;
      }
      if (!payload.totalreceivedamount && payload.totalsellingamount) {
        payload.totalreceivedamount = payload.totalsellingamount * 0.45;
      }
      if (!payload.bookedsellingamount && payload.totalsellingamount) {
        payload.bookedsellingamount = payload.totalsellingamount * 0.7;
      }
      if (!payload.bookedunits && payload.totalunits) {
        payload.bookedunits = Math.floor(payload.totalunits * 0.6);
      }
      if (!payload.progress_ratio) payload.progress_ratio = 0.5;
      if (!payload.land_utilization) payload.land_utilization = 0.8;
      if (!payload.avg_temp) payload.avg_temp = 28;
      if (!payload.total_rain) payload.total_rain = 50;
      if (!payload.totalsquarefootbuild && payload.totalunits) {
        payload.totalsquarefootbuild = payload.totalunits * 1000;
      }
    }
    
    return payload;
  };

  const makePrediction = async () => {
    setIsProcessing(true);
    const payload = buildPayload();
    
    addMessage("ai", "Processing your prediction... This may take a moment.", "text");
    
    try {
      const endpoint = mode === "delay" 
        ? "http://localhost:5000/api/predict/delay"
        : "http://localhost:5000/api/predict/cost-overrun";
      
      const response = await fetch(endpoint, {
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

      setPredictionResult(data);
      displayPredictionResult(data);
      
    } catch (error) {
      console.error(error);
      addMessage("ai", `❌ Error: ${error.message || "Unable to fetch prediction. Please ensure the backend is running."}`, "text");
    } finally {
      setIsProcessing(false);
    }
  };

  const displayPredictionResult = (data) => {
    if (mode === "delay") {
      const pred = data.prediction;
      const recommendations = data.recommendations || [];
      
      const riskColor = pred.risk_level === "High" ? "🔴" : pred.risk_level === "Medium" ? "🟡" : "🟢";
      
      let resultText = `## 📊 Delay Prediction Results\n\n`;
      resultText += `${pred.is_delayed ? "⚠️ **PROJECT IS DELAYED**" : "✅ **PROJECT IS ON TIME**"}\n\n`;
      resultText += `**Delay Probability:** ${(pred.delay_probability * 100).toFixed(1)}%\n`;
      resultText += `**Predicted Delay:** ${pred.predicted_delay_days} ${pred.predicted_delay_days === 1 ? "day" : "days"}\n`;
      resultText += `**Risk Level:** ${riskColor} ${pred.risk_level}\n`;
      resultText += `**Confidence:** ${pred.confidence}\n\n`;
      
      if (recommendations.length > 0) {
        resultText += `### 🎯 AI Recommendations:\n\n`;
        recommendations.forEach((rec, idx) => {
          resultText += `${idx + 1}. ${rec}\n`;
        });
      }
      
      addMessage("ai", resultText, "result");
    } else {
      const pred = data.prediction;
      const recommendations = pred.recommendations || [];
      const alerts = pred.alerts || [];
      
      const currency = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      });
      
      const riskColor = pred.risk_level === "High" ? "🔴" : pred.risk_level === "Medium" ? "🟡" : "🟢";
      
      let resultText = `## 💰 Cost Overrun Prediction Results\n\n`;
      resultText += `**Expected Overrun:** ${pred.expected_overrun_percent > 0 ? "+" : ""}${pred.expected_overrun_percent.toFixed(2)}%\n`;
      resultText += `**Predicted Final Cost:** ${currency.format(pred.predicted_final_cost)}\n`;
      resultText += `**Risk Level:** ${riskColor} ${pred.risk_level}\n\n`;
      
      if (pred.intervals) {
        resultText += `**Confidence Intervals:**\n`;
        resultText += `• P10 (Optimistic): ${pred.intervals.p10.toFixed(2)}% (${currency.format(pred.cost_intervals?.p10 || 0)})\n`;
        resultText += `• P50 (Expected): ${pred.intervals.expected.toFixed(2)}% (${currency.format(pred.cost_intervals?.expected || pred.predicted_final_cost)})\n`;
        resultText += `• P90 (Pessimistic): ${pred.intervals.p90.toFixed(2)}% (${currency.format(pred.cost_intervals?.p90 || 0)})\n\n`;
      }
      
      if (alerts.length > 0) {
        resultText += `### ⚠️ Alerts:\n\n`;
        alerts.forEach((alert, idx) => {
          resultText += `${idx + 1}. ${alert}\n`;
        });
        resultText += `\n`;
      }
      
      if (recommendations.length > 0) {
        resultText += `### 🎯 AI Recommendations:\n\n`;
        recommendations.forEach((rec, idx) => {
          resultText += `${idx + 1}. ${rec}\n`;
        });
      }
      
      addMessage("ai", resultText, "result");
    }
  };

  const handleOptionalField = (text) => {
    const lowerText = text.toLowerCase();
    
    // Check if user wants to proceed
    if (lowerText.includes("proceed") || lowerText.includes("continue") || lowerText.includes("yes") || lowerText === "y") {
      makePrediction();
      return;
    }
    
    // Try to parse optional field
    const optionalFields = mode === "delay" ? DELAY_OPTIONAL_FIELDS : COST_OVERRUN_OPTIONAL_FIELDS;
    
    // Simple parsing: "field_name: value" or just "value" for the next field
    const parts = text.split(":").map(s => s.trim());
    
    if (parts.length === 2) {
      const fieldKey = parts[0].toLowerCase().replace(/\s+/g, "");
      const field = optionalFields.find(f => f.key.toLowerCase() === fieldKey);
      
      if (field) {
        const processedValue = processFieldValue(field, parts[1]);
        if (processedValue !== null) {
          setCollectedData(prev => ({ ...prev, [field.key]: processedValue }));
          addMessage("ai", `Got it! Added ${getFieldLabel(field)}. Provide more optional fields or type 'proceed' to continue.`, "text");
          return;
        }
      }
    }
    
    addMessage("ai", "I didn't understand that. Please provide optional fields in the format 'field_name: value' or type 'proceed' to continue with defaults.", "text");
  };

  const sendMessage = () => {
    if (!input.trim() || isProcessing) return;
    
    const userText = input.trim();
    addMessage("user", userText, "text");
    setInput("");
    
    // Small delay to simulate thinking
    setTimeout(() => {
      if (predictionResult) {
        // Reset for new prediction
        setPredictionResult(null);
        setMode(null);
        setCollectedData({});
        setCurrentFieldIndex(0);
        setIsCollectingFields(false);
        addMessage("ai", "I can help you with another prediction. Would you like to predict **Delay** or **Cost Overrun**?", "text");
        return;
      }
      
      if (isCollectingFields) {
        collectField(userText);
      } else if (mode && !isCollectingFields) {
        // Collecting optional fields
        handleOptionalField(userText);
      } else {
        // Detect intent
        const intent = detectIntent(userText);
        if (intent) {
          startFieldCollection(intent);
        } else if (userText.toLowerCase().includes("help") || userText.toLowerCase().includes("what can")) {
          addMessage("ai", "I can help you with:\n\n🔹 **Delay Prediction** - Predict if your project will be delayed and by how many days\n🔹 **Cost Overrun Prediction** - Predict if your project will exceed budget and by how much\n\nJust tell me what you'd like to predict, or ask about 'delay' or 'cost overrun'!", "text");
        } else {
          addMessage("ai", "I can help you predict **Delay** or **Cost Overrun** for your construction projects.\n\n💡 **Try saying:**\n• \"I want to predict delay\"\n• \"Check cost overrun\"\n• \"Will my project be delayed?\"\n• \"Budget overrun prediction\"\n\nWhich one would you like to know about?", "text");
        }
      }
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="w-96 h-[600px] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col border border-gray-200 dark:border-gray-700 mb-4">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center rounded-t-2xl">
            <div className="font-semibold">AI Project Assistant</div>
            <button 
              onClick={() => setOpen(false)} 
              className="text-xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`p-3 rounded-xl max-w-[85%] text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : msg.type === "result"
                      ? "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-800 text-gray-900 dark:text-gray-100"
                      : "bg-white dark:bg-gray-800 border shadow-sm text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {msg.type === "result" ? (
                    <div className="whitespace-pre-wrap font-mono text-xs">
                      {msg.text.split("\n").map((line, idx) => {
                        if (line.startsWith("##")) {
                          return <h3 key={idx} className="font-bold text-base mb-2 mt-2">{line.replace("##", "").trim()}</h3>;
                        }
                        if (line.startsWith("###")) {
                          return <h4 key={idx} className="font-semibold text-sm mb-1 mt-2">{line.replace("###", "").trim()}</h4>;
                        }
                        if (line.startsWith("**") && line.endsWith("**")) {
                          return <div key={idx} className="font-semibold my-1">{line.replace(/\*\*/g, "")}</div>;
                        }
                        return <div key={idx}>{line || "\u00A0"}</div>;
                      })}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border shadow-sm">
                  <Loader2 className="animate-spin" size={16} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="flex-1 border border-gray-300 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={isCollectingFields ? "Enter value..." : "Ask me anything..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isProcessing}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isProcessing}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl text-3xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        {open ? <X size={24} /> : "💬"}
      </button>
    </div>
  );
}
