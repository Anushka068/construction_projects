# backend/predict.py
import joblib
import numpy as np
import pandas as pd
import os

def create_features(df):
    """Feature engineering - same as training"""
    df = df.copy()
    
    print("\n" + "="*50)
    print("BEFORE FEATURE ENGINEERING:")
    print(f"  Cost: {df['final_project_cost'].iloc[0]:,.0f}")
    print(f"  Units: {df['totalunits'].iloc[0]}")
    print(f"  Duration: {df['planned_duration_days'].iloc[0]}")
    print(f"  Progress: {df.get('progress_ratio', pd.Series([0])).iloc[0]}")
    print(f"  Budget Overrun: {df.get('budget_overrun_percent', pd.Series([0])).iloc[0]}")
    
    # Cost features
    df['cost_per_unit'] = df['final_project_cost'] / (df['totalunits'] + 1)
    df['cost_per_sqft'] = df['final_project_cost'] / (df.get('totalsquarefootbuild', 1) + 1)
    df['land_cost_ratio'] = df.get('totallandcost', 0) / (df['final_project_cost'] + 1)
    df['overrun_severity'] = df.get('budget_overrun_percent', 0) * df['final_project_cost'] / 1e6
    
    # Progress features
    df['booking_rate'] = df.get('bookedunits', 0) / (df['totalunits'] + 1)
    df['utilization_efficiency'] = df.get('land_utilization', 0.5) * df.get('progress_ratio', 0.5)
    
    # Duration features
    df['duration_ratio'] = df.get('actual_duration_days', df['planned_duration_days']) / (df['planned_duration_days'] + 1)
    df['project_complexity'] = df['totalunits'] * df['final_project_cost'] / 1e9
    df['duration_per_unit'] = df['planned_duration_days'] / (df['totalunits'] + 1)
    
    # Weather features
    df['weather_risk'] = df.get('total_rain', 50) * df['planned_duration_days'] / 1000
    df['temp_deviation'] = np.abs(df.get('avg_temp', 27) - 27)
    df['cost_duration_interaction'] = df['final_project_cost'] * df['planned_duration_days'] / 1e9
    df['weather_duration'] = df.get('total_rain', 50) * df['planned_duration_days'] / 365
    
    # Scale indicators
    df['is_large_project'] = int((df['totalunits'] > 100).iloc[0])
    df['is_high_cost'] = int((df['final_project_cost'] > 50000000).iloc[0])

    print("\nAFTER FEATURE ENGINEERING:")
    print(f"  Cost per unit: {df['cost_per_unit'].iloc[0]:,.0f}")
    print(f"  Project complexity: {df['project_complexity'].iloc[0]:.2f}")
    print(f"  Duration per unit: {df['duration_per_unit'].iloc[0]:.2f}")
    print(f"  Overrun severity: {df['overrun_severity'].iloc[0]:,.0f}")
    print(f"  Is large project: {df['is_large_project'].iloc[0]}")
    print(f"  Weather risk: {df['weather_risk'].iloc[0]:.2f}")
    print("="*50 + "\n")
    
    return df

class DelayPredictor:
    """Two-phase delay prediction system"""
    
    def __init__(self, model_dir='models'):
        """Load all required models and preprocessors"""
        self.model_dir = model_dir
        
        # Check if directory exists
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Models directory '{model_dir}' not found!")
        
        # Load classification model
        self.classifier = joblib.load(f'{model_dir}/delay_classifier_xgboost.pkl')
        self.clf_preprocessor = joblib.load(f'{model_dir}/classifier_preprocessor.pkl')
        
        # Load regression model (UPDATED - single XGBoost)
        self.regressor = joblib.load(f'{model_dir}/delay_regressor_xgb_v2.pkl')
        self.reg_preprocessor = joblib.load(f'{model_dir}/regressor_preprocessor.pkl')
        
        print("All models loaded successfully!")
    
    def predict_single(self, project_dict):
        """
        Predict for a single project
        
        Args:
            project_dict: Dictionary with project features
            
        Returns:
            Dictionary with predictions
        """
        df = pd.DataFrame([project_dict])
        result = self.predict(df)
        return result.iloc[0].to_dict()
    
    def predict(self, input_data):
        """
        Make predictions on project data
        
        Args:
            input_data: pandas DataFrame with project features
            
        Returns:
            pandas DataFrame with predictions
        """
        # Apply feature engineering
        df = create_features(input_data)
        
        # Define feature columns
        num_features = [
            "final_project_cost", "totalincurredcost", "totallandcost",
            "budget_overrun_percent", "progress_ratio", "bookedunits",
            "totalunits", "land_utilization", "planned_duration_days",
            "actual_duration_days", "avg_temp", "total_rain",
            "cost_per_unit", "cost_per_sqft", "land_cost_ratio", "overrun_severity",
            "booking_rate", "utilization_efficiency", "duration_ratio",
            "project_complexity", "duration_per_unit", "weather_risk",
            "temp_deviation", "is_large_project", "is_high_cost",
            "cost_duration_interaction", "weather_duration"
        ]
        cat_features = ["final_project_type", "promotertype", "districttype"]
        
        # Fill missing numerical features with defaults
        for feat in num_features:
            if feat not in df.columns:
                df[feat] = 0
        
        # Select features
        available_num = [c for c in num_features if c in df.columns]
        available_cat = [c for c in cat_features if c in df.columns]
        X = df[available_num + available_cat]
        
        # Phase 1: Classification
        X_processed = self.clf_preprocessor.transform(X)
        delay_prob = self.classifier.predict_proba(X_processed)[:, 1]
        is_delayed = self.classifier.predict(X_processed)
        
        # Phase 2: Regression (UPDATED - single model)
        predicted_days = np.zeros(len(X))
        delayed_mask = is_delayed == 1
        
        if delayed_mask.sum() > 0:
            X_delayed = X[delayed_mask]
            X_delayed_processed = self.reg_preprocessor.transform(X_delayed)
            
            # Predict with XGBoost (already in log space)
            pred_log = self.regressor.predict(X_delayed_processed)
            
            # Convert from log space
            predicted_days[delayed_mask] = np.expm1(pred_log)
        
        # Create results
        results = pd.DataFrame({
            'is_delayed': is_delayed,
            'delay_probability': delay_prob,
            'predicted_delay_days': predicted_days.astype(int),
            'risk_level': self._categorize_risk(delay_prob)
        })
        
        return results
    
    def _categorize_risk(self, probabilities):
        """Categorize projects by risk level"""
        risk_levels = []
        for prob in probabilities:
            if prob < 0.3:
                risk_levels.append('Low')
            elif prob < 0.6:
                risk_levels.append('Medium')
            else:
                risk_levels.append('High')
        return risk_levels