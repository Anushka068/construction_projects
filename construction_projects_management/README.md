# Construction Projects Management Platform

End-to-end system for monitoring construction projects, predicting schedule delays and cost overruns, and providing actionable insights via a React dashboard backed by a Flask/ML API.

## Contents

```
construction_projects_management/
├── backend/        # Flask API, ML pipelines, datasets, models
├── frontend/       # React (Vite) dashboard
└── README.md       # This file
```

## What Users Get

| Persona | Pain Point | How the app helps |
|---------|------------|-------------------|
| **CXO / Program Director** | Needs instant view of risky projects across a large portfolio. | Landing dashboard shows live KPIs, risk counts, average overruns, and alerts. Dark/light theme toggle for war rooms or field laptops. |
| **Project Manager** | Wants to know whether today’s inputs (progress, spend, weather) will push the project over budget or schedule. | Delay & cost forms accept live numbers and immediately return probability, P10–P90 ranges, rupee impact, and top drivers. |
| **Finance / Cost Controller** | Must plan contingencies and run “what-if” scenarios (material price hike, contractor delay). | Scenario simulator lets them override key inputs and see how the risk score and expected overrun change, with deltas from the base case. |
| **PMO Analyst** | Needs audit trail and trend analysis across time. | Every prediction is stored (inputs + outputs + model info). `/api/predict/cost-overrun/history` and `/api/dashboard/stats` feed tables & charts for portfolio reviews. |

### Experience Highlights

- **Real-time predictions**: no mock data—every call hits the LightGBM model trained on `Weather_Enriched_Projects_Final.csv`.
- **Confidence & explanations**: Users get P10/50/90 percentages and rupee equivalents plus SHAP-based “why” factors and tailored recommendations.
- **Alerts & drift awareness**: High-risk forecasts trigger alerts; the backend logs drift signals when live inputs diverge from training stats.
- **Historical context**: Recent runs, risk trends, and scenario comparisons remain accessible for exec reviews.
- **Accessibility**: Dark/light mode button works across all pages (Dashboard, Delay, Overrun, Chatbot) for field or office use.

## First-Time Setup (After Cloning)

**Important**: Model files (`.pkl`, `.joblib`, `.parquet`) and the database are excluded from git (they're large/generated files). You need to train the models first.

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
python -m pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Train the Models

The cost overrun model needs to be trained before the API can work:

```bash
cd backend
python train_cost_model.py
```

This will:
- Load the dataset from `backend/dataset/Weather_Enriched_Projects_Final.csv`
- Train CatBoost, LightGBM, and XGBoost models
- Select the best performer (currently LightGBM)
- Save artifacts to `backend/models/cost_overrun/`
- Generate quantile models for confidence intervals
- Create SHAP background sample

**Note**: The delay prediction models (`delay_classifier_xgboost.pkl`, `delay_regressor_xgb_v2.pkl`) should already exist in `backend/models/`. If they're missing, you'll need to train them separately or obtain them from the original source.

### Step 3: Verify Setup

Check that models were created:
```bash
ls backend/models/cost_overrun/    # Should show cost_overrun_v2.0.0.joblib and background_v2.0.0.parquet
ls backend/models/*.pkl            # Should show delay prediction models
```

### Step 4: Start the Services

**Backend:**
```bash
cd backend
python app.py                     # Starts on http://localhost:5000
```

The database (`backend/data/predictions.db`) will be created automatically on first prediction.

**Frontend:**
```bash
cd frontend
npm run dev                       # Starts on http://localhost:5173
```

## Getting Started (After Setup)

### Backend

```bash
cd backend
python app.py                                 # start API on http://localhost:5000
```

Key endpoints:

- `GET /health`
- `POST /api/predict/delay`
- `POST /api/predict/cost-overrun`
- `POST /api/predict/cost-overrun/scenario`
- `GET /api/predict/cost-overrun/history`
- `GET /api/dashboard/stats`

Retraining the cost model (when dataset updates):

```bash
python train_cost_model.py
```

Artifacts are stored under `backend/models/cost_overrun/` with version tags (e.g., `v2.0.0`).

### Frontend

```bash
cd frontend
npm install
npm run dev             # Vite dev server on http://localhost:5173
# or npm run build && npm run preview for production build
```

The frontend README (`frontend/README.md`) contains additional UI-specific notes.

## Data & Storage

- Training data: `backend/dataset/Weather_Enriched_Projects_Final.csv`
- Prediction history: `backend/data/predictions.db` (SQLite). Swap with Postgres/MySQL by updating `storage.py` if needed.

## Next Steps / Ideas

- Add authentication/authorization and multi-user roles.
- Integrate CI/CD, Docker, and cloud storage for model artifacts.
- Extend dashboard analytics with cohort comparisons, time-series trends, and export options.
- Wire alerts to email/Slack and capture feedback loops for continuous learning.

---

For questions or contributions, open an issue or submit a PR.#

