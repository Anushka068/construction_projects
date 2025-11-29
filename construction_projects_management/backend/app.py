# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from predict import DelayPredictor
from services.cost_service import CostOverrunService
from schemas import CostPredictionRequest, ScenarioSimulationRequest
from storage import PredictionRepository
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow frontend to call this API

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load models once at startup (faster predictions)
try:
    predictor = DelayPredictor(model_dir='models')
    logger.info("✅ Delay prediction models loaded successfully!")
except Exception as e:
    logger.error(f"❌ Failed to load delay models: {e}")
    predictor = None

# Load cost overrun service
try:
    cost_service = CostOverrunService()
    logger.info("✅ Cost overrun models loaded successfully!")
except Exception as e:
    logger.error(f"❌ Failed to load cost overrun models: {e}")
    cost_service = None

# Initialize prediction repository for database storage
prediction_repo = PredictionRepository()

# ================================================================
# HEALTH CHECK ENDPOINT
# ================================================================
@app.route('/health', methods=['GET'])
def health_check():
    """Check if API is running"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': predictor is not None,
        'ensemble_available': predictor.ensemble_models is not None if predictor else False
    })

# ================================================================
# DELAY PREDICTION ENDPOINT
# ================================================================
@app.route('/api/predict/delay', methods=['POST'])
def predict_delay():
    """
    Predict project delay
    
    Expected JSON Input:
    {
        "final_project_cost": 50000000,
        "totalincurredcost": 30000000,
        "totallandcost": 10000000,
        "budget_overrun_percent": 10,
        "progress_ratio": 0.6,
        "bookedunits": 50,
        "totalunits": 100,
        "land_utilization": 0.8,
        "planned_duration_days": 730,
        "actual_duration_days": 730,
        "avg_temp": 28,
        "total_rain": 1000,
        "totalsquarefootbuild": 50000,
        "final_project_type": "Residential/Group Housing",
        "promotertype": "COMPANY",
        "districttype": "Ahmedabad",
        "use_ensemble": true  // Optional: use ensemble for more accuracy
    }
    """
    try:
        if predictor is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Get input data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Extract use_ensemble flag (default: False for speed)
        use_ensemble = data.pop('use_ensemble', False)
        
        # DEBUG: Print received data
        logger.info("="*70)
        logger.info("📥 RAW INPUT DATA:")
        logger.info(f"  Cost: ₹{data.get('final_project_cost', 0):,}")
        logger.info(f"  Units: {data.get('totalunits', 0)}")
        logger.info(f"  Duration: {data.get('planned_duration_days', 0)} days")
        logger.info(f"  Progress: {data.get('progress_ratio', 0)*100:.1f}%")
        logger.info(f"  Budget Overrun: {data.get('budget_overrun_percent', 0)}%")
        logger.info(f"  Use Ensemble: {use_ensemble}")
        logger.info("="*70)
        
        # Validate required fields
        required_fields = [
            'final_project_cost', 'totalunits', 'planned_duration_days',
            'final_project_type', 'promotertype', 'districttype'
        ]
        
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Make prediction
        result = predictor.predict_single(data, use_ensemble=use_ensemble, debug=True)
        
        # 🔥 DEBUG PREDICTION OUTPUT
        logger.info("📤 PREDICTION RESULT:")
        logger.info(f"  Is Delayed: {result['is_delayed']}")
        logger.info(f"  Probability: {result['delay_probability']*100:.1f}%")
        logger.info(f"  Predicted Days: {result['predicted_delay_days']}")
        logger.info(f"  Risk Level: {result['risk_level']}")
        logger.info(f"  Override Applied: {result['extreme_override_applied']}")
        logger.info("="*70 + "\n")
        
        # Build response
        recommendations = generate_recommendations(result)
        prediction_data = {
            'is_delayed': bool(result['is_delayed']),
            'delay_probability': float(result['delay_probability']),
            'predicted_delay_days': int(result['predicted_delay_days']),
            'risk_level': result['risk_level'],
            'confidence': result['confidence'],
            'extreme_override_applied': result['extreme_override_applied']
        }
        
        response = {
            'success': True,
            'prediction': prediction_data,
            'recommendations': recommendations,
            'model_info': {
                'ensemble_used': use_ensemble,
                'ensemble_available': predictor.ensemble_models is not None
            }
        }
        
        # Save prediction to database
        try:
            prediction_repo.log_delay_prediction(
                input_payload=data,
                output_payload={'prediction': prediction_data, 'model_info': response['model_info']},
                recommendations=recommendations,
                ensemble_used=use_ensemble,
                model_version='v1.0.0'  # Update this if you version your delay models
            )
            logger.info("✅ Delay prediction saved to database")
        except Exception as db_error:
            logger.warning(f"⚠️ Failed to save delay prediction to database: {db_error}")
            # Don't fail the request if database save fails
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}", exc_info=True)
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ================================================================
# BATCH PREDICTION ENDPOINT (For Dashboard)
# ================================================================
@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict delays for multiple projects.
    
    Expected JSON Input:
    {
        "projects": [
            { /* project 1 data */ },
            { /* project 2 data */ },
            ...
        ],
        "use_ensemble": false  // Optional
    }
    """
    try:
        if predictor is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        data = request.get_json()
        projects = data.get('projects', [])
        use_ensemble = data.get('use_ensemble', False)
        
        if not projects:
            return jsonify({'error': 'No projects provided'}), 400
        
        logger.info(f"📊 Batch prediction for {len(projects)} projects (ensemble={use_ensemble})")
        
        results = []
        for idx, project in enumerate(projects):
            try:
                result = predictor.predict_single(project, use_ensemble=use_ensemble)
                results.append({
                    'project_id': project.get('project_id', f'project_{idx}'),
                    'is_delayed': bool(result['is_delayed']),
                    'delay_probability': float(result['delay_probability']),
                    'predicted_delay_days': int(result['predicted_delay_days']),
                    'risk_level': result['risk_level'],
                    'confidence': result['confidence'],
                    'extreme_override_applied': result['extreme_override_applied']
                })
            except Exception as e:
                logger.error(f"Error predicting project {idx}: {e}")
                results.append({
                    'project_id': project.get('project_id', f'project_{idx}'),
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'predictions': results,
            'summary': {
                'total': len(results),
                'high_risk': sum(1 for r in results if r.get('risk_level') == 'High'),
                'medium_risk': sum(1 for r in results if r.get('risk_level') == 'Medium'),
                'low_risk': sum(1 for r in results if r.get('risk_level') == 'Low')
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Batch prediction error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# ================================================================
# DASHBOARD STATS ENDPOINT
# ================================================================
@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Get dashboard statistics (mock for now, replace with real DB queries)"""
    try:
        # TODO: Replace with actual database queries
        stats = {
            'total_projects': 156,
            'delayed_projects': 42,
            'on_time_projects': 114,
            'avg_delay_days': 78,
            'high_risk_count': 12,
            'medium_risk_count': 28,
            'low_risk_count': 116,
            'total_cost_overrun': 450000
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"❌ Dashboard stats error: {e}")
        return jsonify({'error': str(e)}), 500

# ================================================================
# MODEL INFO ENDPOINT
# ================================================================
@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get information about loaded models"""
    try:
        if predictor is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        info = {
            'classifier': {
                'type': type(predictor.classifier).__name__,
                'loaded': True
            },
            'regressor': {
                'type': type(predictor.regressor).__name__,
                'loaded': True
            },
            'ensemble': {
                'available': predictor.ensemble_models is not None,
                'models_count': len(predictor.ensemble_models) if predictor.ensemble_models else 0,
                'models': list(predictor.ensemble_models.keys()) if predictor.ensemble_models else []
            },
            'threshold': predictor.threshold,
            'features_count': 50  # Approximate
        }
        
        return jsonify({
            'success': True,
            'model_info': info
        })
        
    except Exception as e:
        logger.error(f"❌ Model info error: {e}")
        return jsonify({'error': str(e)}), 500

# ================================================================
# COST OVERRUN PREDICTION ENDPOINT
# ================================================================
@app.route('/api/predict/cost-overrun', methods=['POST'])
def predict_cost_overrun():
    """
    Predict cost overrun for a project
    
    Expected JSON Input:
    {
        "final_project_cost": 50000000,
        "totalunits": 100,
        "planned_duration_days": 365,
        "final_project_type": "Residential/Group Housing",
        "promotertype": "COMPANY",
        "districttype": "Ahmedabad",
        ... (other optional fields)
    }
    """
    try:
        if cost_service is None:
            return jsonify({'error': 'Cost overrun models not loaded'}), 500
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Validate required fields
        required_fields = [
            'final_project_cost', 'totalunits', 'planned_duration_days',
            'final_project_type', 'promotertype', 'districttype'
        ]
        
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Create request object
        try:
            request_obj = CostPredictionRequest(**data)
        except Exception as e:
            return jsonify({
                'error': f'Invalid input data: {str(e)}'
            }), 400
        
        # Make prediction
        result = cost_service.predict(request_obj, persist=True)
        
        # Build response
        response = {
            'success': True,
            'prediction': result.model_dump()
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Cost overrun prediction error: {e}", exc_info=True)
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ================================================================
# COST OVERRUN SCENARIO SIMULATION ENDPOINT
# ================================================================
@app.route('/api/predict/cost-overrun/scenario', methods=['POST'])
def predict_cost_overrun_scenario():
    """
    Run scenario simulations for cost overrun
    """
    try:
        if cost_service is None:
            return jsonify({'error': 'Cost overrun models not loaded'}), 500
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        try:
            request_obj = ScenarioSimulationRequest(**data)
        except Exception as e:
            return jsonify({
                'error': f'Invalid input data: {str(e)}'
            }), 400
        
        simulations = cost_service.simulate(request_obj)
        
        return jsonify({
            'success': True,
            'simulations': simulations
        })
        
    except Exception as e:
        logger.error(f"❌ Scenario simulation error: {e}", exc_info=True)
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ================================================================
# COST OVERRUN HISTORY ENDPOINT
# ================================================================
@app.route('/api/predict/cost-overrun/history', methods=['GET'])
def get_cost_overrun_history():
    """
    Get prediction history
    """
    try:
        if cost_service is None:
            return jsonify({'error': 'Cost overrun models not loaded'}), 500
        
        limit = request.args.get('limit', 50, type=int)
        history = cost_service.history(limit)
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        logger.error(f"❌ History fetch error: {e}", exc_info=True)
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ================================================================
# DELAY PREDICTION HISTORY ENDPOINT
# ================================================================
@app.route('/api/predict/delay/history', methods=['GET'])
def get_delay_history():
    """
    Get delay prediction history
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        history = prediction_repo.fetch_recent_delays(limit)
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        logger.error(f"❌ Delay history fetch error: {e}", exc_info=True)
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ================================================================
# DELAY PREDICTION STATISTICS ENDPOINT
# ================================================================
@app.route('/api/predict/delay/stats', methods=['GET'])
def get_delay_stats():
    """
    Get aggregate statistics for delay predictions
    """
    try:
        stats = prediction_repo.aggregate_delay_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"❌ Delay stats error: {e}", exc_info=True)
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ================================================================
# HELPER FUNCTIONS
# ================================================================
def generate_recommendations(result):
    """Generate recommendations based on prediction"""
    recommendations = []
    
    prob = result['delay_probability']
    days = result['predicted_delay_days']
    override = result['extreme_override_applied']
    
    if override:
        recommendations.append("🚨 CRITICAL: Extreme risk conditions detected - IMMEDIATE EXECUTIVE ACTION REQUIRED")
    
    if prob > 0.7:
        recommendations.append("🚨 High delay risk detected - Immediate action required")
        recommendations.append("👥 Consider increasing workforce allocation")
        recommendations.append("📊 Review critical path activities")
        recommendations.append("💰 Prepare for potential budget revision")
    elif prob > 0.4:
        recommendations.append("⚠️ Moderate delay risk - Enhanced monitoring recommended")
        recommendations.append("🔍 Identify potential bottlenecks early")
        recommendations.append("📅 Review project timeline weekly")
    else:
        recommendations.append("✅ Low delay risk - Continue normal monitoring")
        recommendations.append("📈 Maintain current progress tracking")
    
    if days > 90:
        recommendations.append(f"📅 Predicted delay of {days} days requires immediate timeline revision")
        recommendations.append("💰 Budget for significant cost escalations")
        recommendations.append("👷 Consider accelerated construction methods")
    elif days > 30:
        recommendations.append(f"⏰ Predicted delay of {days} days - Plan mitigation strategies")
    
    return recommendations

# ================================================================
# RUN SERVER
# ================================================================
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True  # Set to False in production
    )