#!/bin/bash
# Setup script for Construction Projects Management Platform
# Run this after cloning the repository

set -e  # Exit on error

echo "🚀 Setting up Construction Projects Management Platform..."
echo ""

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.10+ first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Python and Node.js found"
echo ""

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend
python -m pip install -r requirements.txt
echo "✅ Backend dependencies installed"
echo ""

# Check if dataset exists
if [ ! -f "dataset/Weather_Enriched_Projects_Final.csv" ]; then
    echo "⚠️  Warning: Dataset file not found at backend/dataset/Weather_Enriched_Projects_Final.csv"
    echo "   Please ensure the dataset is present before training models."
    echo ""
fi

# Check if models exist
if [ ! -f "models/cost_overrun/cost_overrun_v2.0.0.joblib" ]; then
    echo "🔧 Training cost overrun models..."
    echo "   This may take a few minutes..."
    python train_cost_model.py
    echo "✅ Cost overrun models trained"
else
    echo "✅ Cost overrun models already exist"
fi

# Check delay models
if [ ! -f "models/delay_classifier_xgboost.pkl" ]; then
    echo "⚠️  Warning: Delay prediction models not found."
    echo "   Delay prediction may not work until models are trained/added."
fi

echo ""

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

cd ..

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start backend:  cd backend && python app.py"
echo "2. Start frontend: cd frontend && npm run dev"
echo ""
echo "Backend will run on http://localhost:5000"
echo "Frontend will run on http://localhost:5173"
echo ""

