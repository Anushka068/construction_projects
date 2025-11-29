# Construction Projects Management Platform

Full-stack system for predicting construction project delays and cost overruns, surfacing real-time risk insights, and supporting what-if scenario planning.

## Repository Layout

```
construction_projects_management/
├── backend/      # Flask API + ML services
├── frontend/     # React (Vite) dashboard
└── dataset/      # Weather_Enriched_Projects_Final.csv (training data)
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- pip & npm

## Quick Start

### 1. Backend

```bash
cd backend
python -m pip install -r requirements.txt
python app.py              # starts Flask on :5000
```

Endpoints:

- `GET /health`
- `POST /api/predict/delay`
- `POST /api/predict/cost-overrun`
- `POST /api/predict/cost-overrun/scenario`
- `GET /api/predict/cost-overrun/history`
- `GET /api/dashboard/stats` (live stats from prediction history)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # Vite dev server on :5173
```

## Key Features

- **Delay Prediction**: Two-phase classifier + regressor with feature engineering aligned to training.
- **Cost Overrun Prediction**:
  - ML pipeline compares CatBoost/LightGBM/XGBoost; selected LightGBM serves real-time predictions.
  - Quantile regressors produce P10–P90 intervals and rupee impact.
  - SHAP explanations, risk scoring, alerts, scenario simulator, and prediction history stored in SQLite.
  - `/api/dashboard/stats` aggregates live metrics (counts, averages, risk mix).
- **Frontend Dashboard**:
  - Interactive cards, charts, and tables for KPIs, SHAP factors, and recent activity.
  - Scenario simulator UI, dark/light theming, responsive layout.

## Training the Cost Model

Re-train whenever the dataset changes:

```bash
cd backend
python train_cost_model.py
```

Artifacts are written to `backend/models/cost_overrun/` with versioned joblib + background samples. The service auto-loads the latest version on restart.

## Storage

- SQLite DB (`backend/data/predictions.db`) logs every cost prediction with inputs, outputs, alerts, and model metadata. Safe for local/demo use; swap with Postgres for production.

## Theming

The React app uses a `ThemeProvider` and Tailwind’s `dark:` classes. Toggle via the header button; classes already applied globally.

## Roadmap Ideas

- Add CI/CD, containerization, and model registry integrations.
- Extend dashboard stats to include delay KPIs and portfolio trend lines.
- Hook alerts into email/Slack and add authentication/authorization.

---

Feel free to adapt this README to include company-specific deployment notes or diagrams.#
