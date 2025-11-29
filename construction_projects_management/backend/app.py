# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import DelayPredictor
from services.cost_service import CostOverrunService
from schemas import CostPredictionRequest, ScenarioSimulationRequest
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
    logger.info("Delay models loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load delay models: {e}")
    predictor = None

try:
    cost_service = CostOverrunService()
    logger.info("Cost overrun service initialized.")
except Exception as e:
    logger.error(f"Failed to initialize cost overrun service: {e}")
    cost_service = None

# ================================================================
# HEALTH CHECK ENDPOINT
# ================================================================
@app.route('/health', methods=['GET'])
def health_check():
    """Check if API is running"""
    return jsonify({
        'status': 'healthy',
        'delay_models_loaded': predictor is not None,
        'cost_model_loaded': cost_service is not None,
        'cost_model_version': getattr(cost_service, 'model_version', None) if cost_service else None
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
        "districttype": "Ahmedabad"
    }
    """
    try:
        if predictor is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Get input data
        data = request.get_json()

         # DEBUG: Print received data
        print("\n" + "="*70)
        print("RAW INPUT DATA:")
        print(f"  Cost (INR): {data.get('final_project_cost'):,}")
        print(f"  Units: {data.get('totalunits')}")
        print(f"  Duration: {data.get('planned_duration_days')} days")
        print(f"  Progress: {data.get('progress_ratio')*100:.1f}%")
        print(f"  Budget Overrun: {data.get('budget_overrun_percent')}%")
        print(f"  Land Util: {data.get('land_utilization')}")
        print(f"  Type: {data.get('final_project_type')}")
        print(f"  Promoter: {data.get('promotertype')}")
        print("="*70)
        
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
        
        # Make prediction
        result = predictor.predict_single(data)

         # DEBUG PREDICTION OUTPUT
        print("PREDICTION RESULT:")
        print(f"  Is Delayed: {result['is_delayed']}")
        print(f"  Probability: {result['delay_probability']*100:.1f}%")
        print(f"  Predicted Days: {result['predicted_delay_days']}")
        print(f"  Risk Level: {result['risk_level']}")
        print("="*70 + "\n")
        
        # Add additional info
        response = {
            'success': True,
            'prediction': {
                'is_delayed': bool(result['is_delayed']),
                'delay_probability': float(result['delay_probability']),
                'predicted_delay_days': int(result['predicted_delay_days']),
                'risk_level': result['risk_level'],
                'confidence': 'High' if result['delay_probability'] > 0.7 or result['delay_probability'] < 0.3 else 'Medium'
            },
            'recommendations': generate_recommendations(result)
        }
        
        logger.info(f"Prediction: {result['risk_level']} risk ({result['delay_probability']*100:.1f}%)")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ================================================================
# COST OVERRUN PREDICTION ENDPOINT
# ================================================================
@app.route('/api/predict/cost-overrun', methods=['POST'])
def predict_cost_overrun():
    """Predict cost overrun percentage and risk level."""
    if cost_service is None:
        return jsonify({'error': 'Cost overrun service unavailable'}), 500

    try:
        payload = CostPredictionRequest(**(request.get_json() or {}))
        result = cost_service.predict(payload)
        return jsonify({'success': True, 'prediction': result.model_dump()})
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Cost prediction failed: %s", exc)
        return jsonify({'error': str(exc), 'success': False}), 400


@app.route('/api/predict/cost-overrun/scenario', methods=['POST'])
def simulate_cost_overrun():
    if cost_service is None:
        return jsonify({'error': 'Cost overrun service unavailable'}), 500

    try:
        payload = ScenarioSimulationRequest(**(request.get_json() or {}))
        simulations = cost_service.simulate(payload)
        return jsonify({'success': True, 'simulations': simulations})
    except Exception as exc:  # noqa: broad-except
        logger.error("Scenario simulation failed: %s", exc)
        return jsonify({'error': str(exc), 'success': False}), 400


@app.route('/api/predict/cost-overrun/history', methods=['GET'])
def cost_prediction_history():
    if cost_service is None:
        return jsonify({'error': 'Cost overrun service unavailable'}), 500

    limit = int(request.args.get('limit', 50))
    history = cost_service.history(limit)
    return jsonify({'success': True, 'history': history})


# ================================================================
# BATCH PREDICTION ENDPOINT (For Dashboard)
# ================================================================
@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """Predict delays for multiple projects"""
    try:
        if predictor is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        data = request.get_json()
        projects = data.get('projects', [])
        
        if not projects:
            return jsonify({'error': 'No projects provided'}), 400
        
        results = []
        for project in projects:
            try:
                result = predictor.predict_single(project)
                results.append({
                    'project_id': project.get('project_id', 'unknown'),
                    'is_delayed': bool(result['is_delayed']),
                    'delay_probability': float(result['delay_probability']),
                    'predicted_delay_days': int(result['predicted_delay_days']),
                    'risk_level': result['risk_level']
                })
            except Exception as e:
                results.append({
                    'project_id': project.get('project_id', 'unknown'),
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'predictions': results
        })
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({'error': str(e)}), 500

# ================================================================
# DASHBOARD STATS ENDPOINT
# ================================================================
@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Get real-time dashboard statistics derived from prediction history."""
    try:
        if cost_service is None:
            return jsonify({'error': 'Cost overrun service unavailable'}), 500

        repo_stats = cost_service.repo.aggregate_stats()
        stats = {
            'total_predictions': repo_stats['total_predictions'],
            'avg_overrun_percent': repo_stats['avg_overrun_percent'],
            'avg_predicted_final_cost': repo_stats['avg_final_cost'],
            'high_risk_count': repo_stats['risk_counts']['High'],
            'medium_risk_count': repo_stats['risk_counts']['Medium'],
            'low_risk_count': repo_stats['risk_counts']['Low'],
            'latest_prediction_at': repo_stats['latest_prediction_at']
        }

        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify({'error': str(e)}), 500

# ================================================================
# HELPER FUNCTIONS
# ================================================================
def generate_recommendations(result):
    """Generate recommendations based on prediction"""
    recommendations = []
    
    prob = result['delay_probability']
    days = result['predicted_delay_days']
    
    if prob > 0.7:
        recommendations.append("High delay risk detected - Immediate action required.")
        recommendations.append("Consider increasing workforce allocation.")
        recommendations.append("Review critical path activities.")
    elif prob > 0.4:
        recommendations.append("Moderate delay risk - Enhanced monitoring recommended.")
        recommendations.append("Identify potential bottlenecks early.")
    else:
        recommendations.append("Low delay risk - Continue normal monitoring.")
    
    if days > 60:
        recommendations.append(f"Predicted delay of {days} days requires timeline revision.")
        recommendations.append("Budget for potential cost escalations.")
    
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