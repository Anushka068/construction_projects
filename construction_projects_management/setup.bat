@echo off
REM Setup script for Construction Projects Management Platform (Windows)
REM Run this after cloning the repository

echo Setting up Construction Projects Management Platform...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+ first.
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+ first.
    exit /b 1
)

echo Python and Node.js found
echo.

REM Backend setup
echo Installing backend dependencies...
cd backend
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)
echo Backend dependencies installed
echo.

REM Check if dataset exists
if not exist "dataset\Weather_Enriched_Projects_Final.csv" (
    echo WARNING: Dataset file not found at backend\dataset\Weather_Enriched_Projects_Final.csv
    echo Please ensure the dataset is present before training models.
    echo.
)

REM Check if models exist
if not exist "models\cost_overrun\cost_overrun_v2.0.0.joblib" (
    echo Training cost overrun models...
    echo This may take a few minutes...
    python train_cost_model.py
    if errorlevel 1 (
        echo ERROR: Failed to train models
        exit /b 1
    )
    echo Cost overrun models trained
) else (
    echo Cost overrun models already exist
)

REM Check delay models
if not exist "models\delay_classifier_xgboost.pkl" (
    echo WARNING: Delay prediction models not found.
    echo Delay prediction may not work until models are trained/added.
)

echo.

REM Frontend setup
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)
echo Frontend dependencies installed
echo.

cd ..

echo Setup complete!
echo.
echo Next steps:
echo 1. Start backend:  cd backend ^&^& python app.py
echo 2. Start frontend: cd frontend ^&^& npm run dev
echo.
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:5173
echo.

pause

