# Models Directory

This directory contains trained ML models for delay and cost overrun prediction.

## Required Files

### Delay Prediction Models
These should be present for delay prediction to work:
- `delay_classifier_xgboost.pkl` - Classifier to predict if a project will be delayed
- `delay_regressor_xgb_v2.pkl` - Regressor to predict delay days
- `classifier_preprocessor.pkl` - Preprocessor for classifier
- `regressor_preprocessor.pkl` - Preprocessor for regressor
- `delay_regressor_xgb_v2.json` - Model metadata (optional)

**Note**: If these files are missing, delay prediction endpoints will return errors. You'll need to train them separately or obtain them from the original source.

### Cost Overrun Models
These are generated automatically when you run `train_cost_model.py`:
- `cost_overrun/cost_overrun_v2.0.0.joblib` - Main LightGBM model
- `cost_overrun/background_v2.0.0.parquet` - SHAP background sample

**To generate**: Run `python train_cost_model.py` from the `backend/` directory.

## First-Time Setup

After cloning the repository:

1. **Train cost overrun models**:
   ```bash
   cd backend
   python train_cost_model.py
   ```

2. **Verify models exist**:
   ```bash
   ls models/cost_overrun/    # Should show .joblib and .parquet files
   ls models/*.pkl            # Should show delay models
   ```

3. **If delay models are missing**, you'll need to:
   - Train them using the original training script, OR
   - Obtain them from the original source/repository

## Model Versions

- **Cost Overrun**: v2.0.0 (LightGBM, selected after benchmarking CatBoost/XGBoost)
- **Delay Prediction**: v2 (XGBoost-based)

## File Sizes

Model files are excluded from git (see `.gitignore`) because they're large:
- Cost overrun model: ~5-10 MB
- Delay models: ~2-5 MB each
- Background sample: ~1-2 MB

These are generated files and can be recreated by running the training scripts.

