# Delay Prediction Database Implementation

## 📋 Overview

A comprehensive database storage system has been implemented for delay predictions, similar to the cost overrun predictions. This enables analytics, trend analysis, and historical insights.

---

## 🗄️ Database Schema

### **Table: `delay_predictions`**

The table stores both **normalized** (JSON payloads) and **denormalized** (individual columns) data for optimal query performance.

#### **Core Fields:**
- `id` - Auto-incrementing primary key
- `created_at` - Timestamp (ISO format)
- `model_version` - ML model version used
- `ensemble_used` - Boolean flag (0/1)

#### **Prediction Results:**
- `is_delayed` - Boolean (0 = On Time, 1 = Delayed)
- `delay_probability` - Float (0.0 to 1.0)
- `predicted_delay_days` - Integer (days of delay)
- `risk_level` - Text ("Low", "Medium", "High")
- `confidence` - Text ("Low", "Medium", "High")
- `extreme_override_applied` - Boolean (0/1)

#### **Metadata:**
- `recommendations` - JSON array of recommendation strings
- `input_payload` - Complete input data (JSON)
- `output_payload` - Complete prediction results (JSON)

#### **Denormalized Fields (for Analytics):**
These fields are extracted from input_payload for easy querying and analytics:

**Project Basics:**
- `final_project_cost` - REAL
- `totalunits` - INTEGER
- `planned_duration_days` - INTEGER
- `actual_duration_days` - INTEGER

**Progress & Financial:**
- `progress_ratio` - REAL (0.0 to 1.0)
- `budget_overrun_percent` - REAL
- `bookedunits` - INTEGER
- `land_utilization` - REAL

**Categorical:**
- `final_project_type` - TEXT (e.g., "Residential/Group Housing")
- `promotertype` - TEXT (e.g., "COMPANY")
- `districttype` - TEXT (e.g., "Ahmedabad")

**Environmental:**
- `avg_temp` - REAL (°C)
- `total_rain` - REAL (mm)

---

## 🔧 Implementation Details

### **1. Storage Layer (`storage.py`)**

#### **New Methods Added:**

**`log_delay_prediction()`**
- Saves delay prediction to database
- Stores both JSON payloads and denormalized fields
- Handles NULL values gracefully

**`fetch_recent_delays(limit)`**
- Retrieves recent delay predictions
- Returns formatted data with parsed JSON
- Used for history pages

**`aggregate_delay_stats()`**
- Calculates comprehensive statistics:
  - Total predictions count
  - Delayed vs. On-time count
  - Delay rate percentage
  - Risk level distribution
  - Average delay probability
  - Average delay days (for delayed projects)
  - Confidence level distribution
  - Project type distribution
  - District distribution

### **2. API Integration (`app.py`)**

#### **Updated Endpoint:**
- `POST /api/predict/delay` - Now automatically saves predictions to database

#### **New Endpoints:**
- `GET /api/predict/delay/history?limit=50` - Fetch prediction history
- `GET /api/predict/delay/stats` - Get aggregate statistics

---

## 📊 Analytics Capabilities

### **What You Can Analyze:**

#### **1. Delay Trends Over Time**
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_predictions,
    SUM(is_delayed) as delayed_count,
    AVG(delay_probability) as avg_probability,
    AVG(CASE WHEN is_delayed = 1 THEN predicted_delay_days END) as avg_delay_days
FROM delay_predictions
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### **2. Risk Level Distribution**
```sql
SELECT 
    risk_level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM delay_predictions), 2) as percentage
FROM delay_predictions
GROUP BY risk_level;
```

#### **3. Project Type Analysis**
```sql
SELECT 
    final_project_type,
    COUNT(*) as total,
    SUM(is_delayed) as delayed,
    AVG(delay_probability) as avg_probability,
    AVG(predicted_delay_days) as avg_delay_days
FROM delay_predictions
WHERE final_project_type IS NOT NULL
GROUP BY final_project_type;
```

#### **4. District-wise Performance**
```sql
SELECT 
    districttype,
    COUNT(*) as total,
    SUM(is_delayed) as delayed,
    ROUND(SUM(is_delayed) * 100.0 / COUNT(*), 2) as delay_rate
FROM delay_predictions
WHERE districttype IS NOT NULL
GROUP BY districttype
ORDER BY delay_rate DESC;
```

#### **5. Progress Ratio Impact**
```sql
SELECT 
    CASE 
        WHEN progress_ratio < 0.3 THEN 'Early Stage (<30%)'
        WHEN progress_ratio < 0.6 THEN 'Mid Stage (30-60%)'
        ELSE 'Late Stage (>60%)'
    END as stage,
    COUNT(*) as count,
    AVG(delay_probability) as avg_probability,
    AVG(predicted_delay_days) as avg_delay_days
FROM delay_predictions
WHERE progress_ratio IS NOT NULL
GROUP BY stage;
```

#### **6. Budget Overrun Correlation**
```sql
SELECT 
    CASE 
        WHEN budget_overrun_percent < 0 THEN 'Under Budget'
        WHEN budget_overrun_percent < 10 THEN 'Low Overrun (0-10%)'
        WHEN budget_overrun_percent < 20 THEN 'Medium Overrun (10-20%)'
        ELSE 'High Overrun (>20%)'
    END as overrun_category,
    COUNT(*) as count,
    AVG(delay_probability) as avg_probability,
    SUM(is_delayed) as delayed_count
FROM delay_predictions
WHERE budget_overrun_percent IS NOT NULL
GROUP BY overrun_category;
```

---

## 📈 Use Cases for Analytics

### **1. Dashboard Visualizations**
- **Delay Rate Over Time**: Line chart showing % of delayed projects by month
- **Risk Distribution**: Pie chart of Low/Medium/High risk projects
- **Average Delay Days**: Bar chart by project type
- **District Performance**: Heatmap showing delay rates by district

### **2. Business Intelligence**
- **Portfolio Risk Assessment**: "What % of our projects are at High risk?"
- **Project Type Insights**: "Which project types have highest delay rates?"
- **Geographic Analysis**: "Which districts have most delays?"
- **Progress Impact**: "How does progress ratio affect delay probability?"

### **3. Model Performance Tracking**
- **Prediction Accuracy**: Compare predicted vs. actual delays (when actual data available)
- **Model Version Comparison**: Track performance across model versions
- **Confidence Analysis**: See how confidence levels correlate with accuracy

### **4. Operational Insights**
- **Early Warning System**: Identify projects with increasing delay probability
- **Resource Allocation**: Focus on high-risk projects
- **Trend Detection**: Spot patterns in delay causes

---

## 🔄 Data Flow

```
User Request (Chatbot/Form)
    ↓
POST /api/predict/delay
    ↓
DelayPredictor.predict_single()
    ↓
Generate Prediction + Recommendations
    ↓
PredictionRepository.log_delay_prediction()
    ↓
SQLite Database (delay_predictions table)
    ↓
Stores: Input + Output + Denormalized Fields
    ↓
Available for: History, Analytics, Dashboards
```

---

## 🎯 Key Features

### **1. Complete Audit Trail**
- Every prediction is saved with full input/output data
- Timestamped for time-series analysis
- Model version tracking for model evolution

### **2. Optimized for Analytics**
- Denormalized fields for fast queries
- No need to parse JSON for common queries
- Indexed fields for performance

### **3. Flexible Querying**
- Query by any field (project type, district, risk level, etc.)
- Time-range filtering
- Aggregation capabilities

### **4. Future-Proof**
- JSON payloads store complete data (even if schema changes)
- Denormalized fields can be added/removed as needed
- Easy to export to other systems

---

## 📝 Example API Usage

### **Get Recent Predictions:**
```bash
GET /api/predict/delay/history?limit=10
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "created_at": "2024-01-15T10:30:00",
      "is_delayed": true,
      "delay_probability": 0.75,
      "predicted_delay_days": 45,
      "risk_level": "High",
      "confidence": "High",
      "recommendations": ["...", "..."],
      "input_payload": {...},
      "output_payload": {...}
    }
  ]
}
```

### **Get Statistics:**
```bash
GET /api/predict/delay/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_predictions": 150,
    "delayed_count": 45,
    "on_time_count": 105,
    "delay_rate": 30.0,
    "risk_counts": {
      "High": 20,
      "Medium": 25,
      "Low": 105
    },
    "avg_delay_probability": 0.42,
    "avg_delay_days": 38.5,
    "confidence_counts": {
      "High": 80,
      "Medium": 50,
      "Low": 20
    },
    "project_type_distribution": {
      "Residential/Group Housing": 100,
      "Commercial": 30,
      "Mixed Development": 20
    },
    "district_distribution": {
      "Ahmedabad": 50,
      "Surat": 40,
      "Vadodara": 30
    }
  }
}
```

---

## 🚀 Next Steps

With this database in place, you can:

1. **Build Analytics Dashboard**: Create charts and visualizations
2. **Generate Reports**: Monthly/quarterly delay analysis reports
3. **Model Improvement**: Use historical data to retrain models
4. **Alert System**: Set up alerts for high-risk predictions
5. **Comparative Analysis**: Compare delay vs. cost overrun patterns
6. **Export Data**: Export to Excel/CSV for external analysis

---

## 💡 Best Practices

1. **Regular Backups**: Backup `predictions.db` regularly
2. **Index Optimization**: Add indexes on frequently queried fields if needed
3. **Data Retention**: Consider archiving old predictions if database grows large
4. **Privacy**: Ensure sensitive project data is handled according to privacy policies

---

## 📊 Database Location

The SQLite database file is stored at:
```
backend/data/predictions.db
```

This file contains **both** `cost_predictions` and `delay_predictions` tables.

