# backend/predict.py
import joblib
import numpy as np
import pandas as pd
import os
from copy import deepcopy

# ============================================================================
# FEATURE ENGINEERING (MUST MATCH TRAINING CODE EXACTLY!)
# ============================================================================
def create_features(df_in):
    """
    Enhanced feature engineering - MUST match training pipeline exactly.
    This creates 50+ features from raw inputs.
    """
    df = df_in.copy()
    
    # Define defaults for missing values
    defaults = {
        'final_project_cost': 0, 'totalincurredcost': 0, 'totalunits': 1,
        'totalsquarefootbuild': 1, 'totallandcost': 0, 'budget_overrun_percent': 0,
        'progress_ratio': 0.0, 'bookedunits': 0, 'land_utilization': 0.0,
        'planned_duration_days': 1, 'actual_duration_days': 0,
        'avg_temp': 27.0, 'total_rain': 0.0
    }
    
    for col, val in defaults.items():
        if col in df.columns:
            df[col] = df[col].fillna(val)
        else:
            df[col] = val
    
    # ===== COST FEATURES =====
    df['cost_per_unit'] = df['final_project_cost'] / df['totalunits']
    df['cost_per_sqft'] = df['final_project_cost'] / df['totalsquarefootbuild']
    df['land_cost_ratio'] = df['totallandcost'] / (df['final_project_cost'] + 1)
    df['cost_efficiency'] = df['totalsquarefootbuild'] / (df['final_project_cost'] / 1e6)
    
    # ===== OVERRUN FEATURES =====
    df['overrun_severity'] = df['budget_overrun_percent'] * df['final_project_cost'] / 1e6
    df['has_overrun'] = (df['budget_overrun_percent'] > 0).astype(int)
    df['overrun_penalty'] = np.where(
        df['budget_overrun_percent'] > 15,
        np.power(df['budget_overrun_percent'] / 15, 2),
        df['budget_overrun_percent'] / 15
    )
    df['overrun_category'] = pd.cut(
        df['budget_overrun_percent'],
        bins=[-np.inf, 0, 5, 15, 25, np.inf],
        labels=[0, 1, 2, 3, 4]
    ).astype(int)
    
    # ===== PROGRESS FEATURES =====
    df['booking_rate'] = df['bookedunits'] / df['totalunits']
    df['utilization_efficiency'] = df['land_utilization'] * df['progress_ratio']
    df['progress_risk'] = np.where(
        df['progress_ratio'] < 0.3,
        (0.3 - df['progress_ratio']) * 3,
        0
    )
    df['progress_stage'] = pd.cut(
        df['progress_ratio'],
        bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0],
        labels=[0, 1, 2, 3, 4]
    ).astype(int)
    df['is_early_stage'] = (df['progress_ratio'] < 0.2).astype(int)
    
    # ===== DURATION FEATURES =====
    df['duration_ratio'] = df['actual_duration_days'].where(
        df['actual_duration_days'] > 0,
        df['planned_duration_days']
    ) / df['planned_duration_days']
    df['duration_per_unit'] = df['planned_duration_days'] / df['totalunits']
    df['duration_per_sqft'] = df['planned_duration_days'] / df['totalsquarefootbuild']
    
    # ===== COMPLEXITY =====
    df['project_complexity'] = df['totalunits'] * df['final_project_cost'] / 1e9
    df['size_complexity'] = df['totalunits'] * df['totalsquarefootbuild'] / 1e6
    
    # ===== WEATHER =====
    df['weather_risk'] = df['total_rain'] * df['planned_duration_days'] / 1000
    df['temp_deviation'] = np.abs(df['avg_temp'] - 27)
    df['weather_duration'] = df['total_rain'] * df['planned_duration_days'] / 365
    df['extreme_weather'] = ((df['temp_deviation'] > 5) | (df['total_rain'] > 3000)).astype(int)
    
    # ===== INTERACTIONS =====
    df['overrun_progress_crisis'] = df['budget_overrun_percent'] * (1 - df['progress_ratio']) * 2
    df['cost_progress_risk'] = np.where(
        (df['final_project_cost'] > 50e6) &
        (df['progress_ratio'] < 0.4),
        (df['final_project_cost'] / 50e6) * (0.4 - df['progress_ratio']) * 10,
        0
    )
    df['booking_lag'] = np.maximum(0, df['progress_ratio'] - df['booking_rate'])
    df['severe_booking_lag'] = (df['booking_lag'] > 0.3).astype(int)
    df['cost_duration_interaction'] = df['final_project_cost'] * df['planned_duration_days'] / 1e9
    
    # ===== SCALE INDICATORS =====
    df['is_large_project'] = (df['totalunits'] > 100).astype(int)
    df['is_high_cost'] = (df['final_project_cost'] > 50e6).astype(int)
    df['is_long_duration'] = (df['planned_duration_days'] > 500).astype(int)
    
    # ===== RISK FLAGS =====
    df['high_risk_flag'] = (
        (df['budget_overrun_percent'] > 10) |
        (df['progress_ratio'] < 0.35) |
        (df['duration_ratio'] > 1.15) |
        ((df['budget_overrun_percent'] > 5) & (df['progress_ratio'] < 0.5))
    ).astype(int)
    df['critical_risk_flag'] = (
        (df['budget_overrun_percent'] > 20) |
        (df['progress_ratio'] < 0.2) |
        ((df['budget_overrun_percent'] > 15) & (df['progress_ratio'] < 0.3))
    ).astype(int)
    df['risk_score'] = (
        (df['budget_overrun_percent'] * 2) +
        ((1 - df['progress_ratio']) * 30) +
        (df['booking_lag'] * 20) +
        (df['duration_ratio'] - 1) * 10
    ).clip(0, 100)
    
    # Clean infinities and NaNs
    df = df.replace([np.inf, -np.inf], np.nan)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(0).clip(lower=-1e10, upper=1e10)
    
    return df


# ============================================================================
# DELAY PREDICTOR CLASS
# ============================================================================
class DelayPredictor:
    """
    Two-phase delay prediction system with ensemble support.
    """

    # -------------------------------
    # FIX: Convert numpy → python types
    # -------------------------------
    def _to_python(self, value):
        import numpy as np
        if isinstance(value, (np.integer)):
            return int(value)
        if isinstance(value, (np.floating)):
            return float(value)
        if isinstance(value, (np.bool_)):
            return bool(value)
        return value
    
    def __init__(self, model_dir=None):
        """
        Load models from the correct location.
        """
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))

        # if model_dir not given, default is backend/models
        self.model_dir = os.path.join(BASE_DIR, "models") if model_dir is None else model_dir
    
        model_dir = self.model_dir

        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Models directory '{model_dir}' not found!")

        # -------------------------------
        # LOAD MODELS
        # -------------------------------
        try:
            self.classifier = joblib.load(f'{model_dir}/delay/classifier.pkl')
            self.clf_preprocessor = joblib.load(f'{model_dir}/delay/classifier_preprocessor.pkl')
            print("✅ Classifier loaded")
        except FileNotFoundError:
            raise FileNotFoundError(f"Missing classifier.pkl or classifier_preprocessor.pkl")

        try:
            self.regressor = joblib.load(f'{model_dir}/delay/regressor.pkl')
            self.reg_preprocessor = joblib.load(f'{model_dir}/delay/regressor_preprocessor.pkl')
            print("✅ Regressor loaded")
        except FileNotFoundError:
            raise FileNotFoundError(f"Missing regressor.pkl or regressor_preprocessor.pkl")

        try:
            self.ensemble_models = joblib.load(f'{model_dir}/delay/ensemble_models.pkl')
            self.ensemble_weights = joblib.load(f'{model_dir}/delay/ensemble_weights.pkl')
            print(f"✅ Ensemble loaded ({len(self.ensemble_models)} models)")
        except FileNotFoundError:
            self.ensemble_models = None
            self.ensemble_weights = None
            print("⚠️ Ensemble not found — using single model")
        
        self.threshold = 0.50
        print("✅ All models loaded successfully!")

    # -------------------------------
    # EXTREME RISK CHECK
    # -------------------------------
    def _check_extreme_risk(self, data, df_feat):
        overrun = data.get('budget_overrun_percent', 0)
        progress = data.get('progress_ratio', 1)
        risk_score = df_feat['risk_score'].values[0]

        if overrun > 20 and progress < 0.25:
            return True, 0.85, f"Critical: {overrun:.0f}% overrun at {progress*100:.0f}% progress"
        if overrun > 15 and progress < 0.35:
            return True, 0.75, f"High risk: {overrun:.0f}% overrun at {progress*100:.0f}% progress"
        if risk_score > 70:
            return True, 0.80, f"Risk score: {risk_score:.0f}/100"
        
        return False, None, None

    # -------------------------------
    # MAIN PREDICT FUNCTION
    # -------------------------------
    def predict_single(self, project_dict, use_ensemble=False, enable_override=True, debug=False):

        df = pd.DataFrame([project_dict])

        df_feat = create_features(df)
        is_extreme, adj_prob, reason = self._check_extreme_risk(project_dict, df_feat)

        # Phase 1 — Classification
        num_features = [
            "final_project_cost", "totalincurredcost", "totallandcost",
            "cost_per_unit", "cost_per_sqft", "land_cost_ratio", "cost_efficiency",
            "budget_overrun_percent", "overrun_severity", "has_overrun",
            "overrun_category", "overrun_penalty",
            "progress_ratio", "booking_rate", "utilization_efficiency",
            "progress_stage", "progress_risk", "is_early_stage",
            "bookedunits", "totalunits", "totalsquarefootbuild", "land_utilization",
            "planned_duration_days", "actual_duration_days", "duration_ratio",
            "duration_per_unit", "duration_per_sqft",
            "project_complexity", "size_complexity",
            "avg_temp", "total_rain", "weather_risk", "temp_deviation",
            "weather_duration", "extreme_weather",
            "cost_duration_interaction", "overrun_progress_crisis",
            "cost_progress_risk", "booking_lag", "severe_booking_lag",
            "is_large_project", "is_high_cost", "is_long_duration",
            "high_risk_flag", "critical_risk_flag", "risk_score"
        ]

        cat_features = ["final_project_type", "promotertype", "districttype"]

        available_num = [c for c in num_features if c in df_feat.columns]
        available_cat = [c for c in cat_features if c in df_feat.columns]
        X = df_feat[available_num + available_cat]

        X_clf = self.clf_preprocessor.transform(X)
        prob_raw = self.classifier.predict_proba(X_clf)[:, 1][0]

        if enable_override and is_extreme and adj_prob:
            prob = max(prob_raw, adj_prob)
            override = prob > prob_raw
        else:
            prob = prob_raw
            override = False

        pred_delayed = prob >= self.threshold

        # Phase 2 — Regression
        pred_days = 0
        if pred_delayed:
            X_reg = self.reg_preprocessor.transform(X)
            if use_ensemble and self.ensemble_models:
                predictions = [np.expm1(m.predict(X_reg)[0]) for m in self.ensemble_models.values()]
                pred_days = int(np.average(predictions, weights=self.ensemble_weights))
            else:
                pred_days = int(np.expm1(self.regressor.predict(X_reg)[0]))

        # Final return (all python-native types)
        return {
            'is_delayed': self._to_python(pred_delayed),
            'delay_probability': float(prob),
            'predicted_delay_days': self._to_python(pred_days),
            'risk_level': (
                'High' if prob >= 0.65 else
                'Medium' if prob >= 0.25 else
                'Low'
            ),
            'extreme_override_applied': self._to_python(override),
            'confidence': (
                'High' if abs(prob - self.threshold) > 0.25 else
                'Medium' if abs(prob - self.threshold) > 0.12 else
                'Low'
            )
        }

    # -------------------------------
    # BATCH PREDICT
    # -------------------------------
    def predict_batch(self, projects_list, use_ensemble=False):
        return [self.predict_single(p, use_ensemble=use_ensemble) for p in projects_list]
