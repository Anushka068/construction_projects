# Architecture Explanation: Cost Service & SQLite Storage

## 📋 Overview

This document explains the purpose and functionality of `cost_service.py` and `storage.py` in the construction project management system.

---

## 🔧 File 1: `cost_service.py` - Cost Overrun Prediction Service

### **Purpose**
`cost_service.py` is the **core business logic layer** for cost overrun predictions. It acts as a service that:
- Loads trained ML models
- Processes prediction requests
- Performs feature engineering
- Makes predictions
- Generates explanations and recommendations
- **Saves predictions to database** (via `storage.py`)

### **Key Responsibilities**

#### 1. **Model Loading & Initialization** (Lines 46-70)
```python
def __init__(self, artifact_path, background_path):
    # Loads trained ML models from disk
    self.model = self.artifacts["point_model"]  # Main prediction model
    self.quantile_lower = ...  # For confidence intervals (P10)
    self.quantile_upper = ...   # For confidence intervals (P90)
    self.explainer = shap.TreeExplainer(...)  # For explainability
    self.repo = PredictionRepository()  # SQLite database connection
```

#### 2. **Main Prediction Method** (Lines 75-145)
```python
def predict(payload, persist=True):
    # 1. Convert input to DataFrame
    # 2. Validate data
    # 3. Check for data drift
    # 4. Make prediction (point estimate + confidence intervals)
    # 5. Generate risk level, alerts, recommendations
    # 6. **Save to SQLite if persist=True**
    # 7. Return prediction response
```

**What it does:**
- Takes project data (cost, units, duration, etc.)
- Predicts cost overrun percentage
- Provides confidence intervals (P10, P50, P90)
- Generates risk assessment (Low/Medium/High)
- Creates alerts and recommendations
- **Logs everything to SQLite database**

#### 3. **Feature Engineering** (Lines 171-202)
- Converts input data to proper formats
- Creates derived features (e.g., `cost_per_unit`, `govt_dependency`)
- Ensures all numeric fields are properly typed

#### 4. **Explainability** (Lines 211-236)
- Uses SHAP (SHapley Additive exPlanations) to explain predictions
- Identifies top 5 factors contributing to cost overrun
- Shows which features increase/decrease risk

#### 5. **Scenario Simulation** (Lines 147-163)
- Allows "what-if" analysis
- Tests different scenarios (e.g., "What if material costs increase 10%?")
- Compares multiple scenarios without saving to database

---

## 💾 File 2: `storage.py` - SQLite Database Layer

### **Purpose**
`storage.py` provides **persistent storage** for all cost overrun predictions using SQLite. It's an **audit trail and history system**.

### **What is SQLite?**
SQLite is a **lightweight, file-based database** that:
- Stores data in a single file (`predictions.db`)
- Doesn't require a separate database server
- Perfect for small to medium applications
- Provides SQL query capabilities
- Automatically creates the database file if it doesn't exist

### **Database Schema**

The `cost_predictions` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-incrementing unique ID |
| `created_at` | TEXT | Timestamp (ISO format) when prediction was made |
| `model_version` | TEXT | Which ML model version was used (e.g., "v2.0.0") |
| `scenario_name` | TEXT | Optional scenario name (e.g., "Material +5%") |
| `risk_level` | TEXT | Risk assessment: "Low", "Medium", or "High" |
| `alerts` | TEXT | JSON array of alert messages |
| `input_payload` | TEXT | **Complete input data** (JSON) - what user provided |
| `output_payload` | TEXT | **Complete prediction results** (JSON) - model output |

### **What Gets Stored?**

#### **Input Payload** (What user sent):
```json
{
  "final_project_cost": 50000000,
  "totalunits": 100,
  "planned_duration_days": 365,
  "final_project_type": "Residential/Group Housing",
  "promotertype": "COMPANY",
  "districttype": "Ahmedabad",
  "progress_ratio": 0.5,
  ...
}
```

#### **Output Payload** (What model predicted):
```json
{
  "expected_overrun_percent": 15.5,
  "predicted_final_cost": 57750000,
  "risk_level": "Medium",
  "intervals": {
    "p10": 8.2,
    "expected": 15.5,
    "p90": 22.8
  },
  "alerts": ["Low progress ratio with rising costs."],
  "recommendations": ["Tighten procurement approvals..."],
  ...
}
```

### **Key Methods**

#### 1. **`log_prediction()`** (Lines 40-72)
```python
def log_prediction(model_version, input_payload, output_payload, risk_level, ...):
    # Saves a complete prediction record to SQLite
    # Called automatically after each prediction
```

**When it's called:**
- Every time `cost_service.predict()` runs with `persist=True`
- Automatically saves both input and output for audit trail

#### 2. **`fetch_recent()`** (Lines 74-91)
```python
def fetch_recent(limit=50):
    # Retrieves last N predictions from database
    # Used for history pages, dashboards, trend analysis
```

**Used by:**
- Frontend history page (`/overrun/result`)
- Dashboard statistics
- Trend analysis charts

#### 3. **`aggregate_stats()`** (Lines 93-127)
```python
def aggregate_stats():
    # Calculates statistics across all predictions:
    # - Total predictions count
    # - Risk level distribution
    # - Average overrun percentage
    # - Average final cost
```

**Used for:**
- Dashboard overview
- Portfolio-level insights
- Model performance tracking

---

## 🔄 How They Work Together

### **Flow Diagram:**

```
User Request (Chatbot/Form)
    ↓
Flask API Endpoint (/api/predict/cost-overrun)
    ↓
CostOverrunService.predict()
    ↓
├─→ Validates input
├─→ Engineers features
├─→ Makes ML prediction
├─→ Generates recommendations
└─→ PredictionRepository.log_prediction()
        ↓
    SQLite Database (predictions.db)
        ↓
    Stores: Input + Output + Metadata
```

### **Example Flow:**

1. **User asks chatbot:** "Predict cost overrun for my project"
2. **Chatbot collects:** Project cost, units, duration, etc.
3. **API calls:** `CostOverrunService.predict(payload)`
4. **Service:**
   - Loads ML model
   - Processes data
   - Predicts: "15.5% overrun, Medium risk"
   - Generates: "Tighten procurement approvals..."
5. **Storage:**
   - Saves to SQLite: Input data + Prediction result + Timestamp
6. **Response:** Returns prediction to user

---

## 🎯 Why SQLite? What's It Useful For?

### **1. Audit Trail & Compliance**
- **Complete history** of every prediction
- **Reproducibility**: Can see exactly what was predicted and when
- **Compliance**: Required for regulated industries
- **Debugging**: If predictions seem wrong, can review historical data

### **2. Model Performance Tracking**
- Track how model performs over time
- Compare predictions vs. actual outcomes (if you add actual results later)
- Identify when model needs retraining

### **3. Business Intelligence**
- **Trend Analysis**: "Are projects getting riskier over time?"
- **Portfolio View**: "What % of our projects are High risk?"
- **Scenario Comparison**: "How did different scenarios perform?"

### **4. User Features**
- **History Page**: Users can see their past predictions
- **Dashboard**: Aggregate statistics across all projects
- **Charts**: Visualize trends over time

### **5. Data Science & ML**
- **Training Data**: Can use stored predictions to improve models
- **A/B Testing**: Compare different model versions
- **Feature Analysis**: See which features correlate with outcomes

---

## 📊 Real-World Use Cases

### **Use Case 1: Project Manager**
- Makes prediction: "Project X: 20% overrun, High risk"
- **3 months later**: Actual overrun was 18%
- Can review stored prediction to see if model was accurate
- Helps improve future predictions

### **Use Case 2: Executive Dashboard**
- Views aggregate stats: "45% of projects are Medium/High risk"
- Can drill down into specific predictions
- Makes strategic decisions based on portfolio risk

### **Use Case 3: Data Scientist**
- Reviews stored predictions to identify patterns
- Uses historical data to retrain/improve model
- Analyzes which features are most predictive

### **Use Case 4: Compliance/Audit**
- Auditor asks: "Show me all High-risk predictions from last quarter"
- System queries SQLite database
- Provides complete audit trail with inputs and outputs

---

## 🔍 Database Location

The SQLite database file is stored at:
```
backend/data/predictions.db
```

You can:
- **View it**: Use SQLite browser tools (DB Browser for SQLite)
- **Query it**: Direct SQL queries
- **Backup it**: Just copy the `.db` file
- **Export it**: Convert to CSV/JSON for analysis

---

## 💡 Key Takeaways

1. **`cost_service.py`**: The "brain" - handles all prediction logic
2. **`storage.py`**: The "memory" - saves everything for future use
3. **SQLite**: Lightweight database perfect for this use case
4. **Why store?**: Audit trail, history, analytics, compliance, debugging
5. **What's stored?**: Complete input data + prediction results + metadata

---

## 🚀 Future Enhancements

With this storage system, you could add:
- **Actual vs. Predicted tracking**: Compare predictions to real outcomes
- **Model versioning**: Track which model version made each prediction
- **User analytics**: See which users make most predictions
- **Export features**: Download prediction history as CSV/Excel
- **Advanced queries**: Filter by date range, risk level, project type, etc.

