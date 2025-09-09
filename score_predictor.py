
# ===== score_predictor.py =====
import pandas as pd
import joblib
import numpy as np
from typing import Dict, Any, Optional

def validate_input_data(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and clean input data"""
    validated_data = {}
    
    # Define expected ranges for each field
    field_ranges = {
        'cgpa': (5.0, 10.0),
        'backlogs': (0, 10),
        'certifications': (0, 20),
        'aptitude': (0, 10),
        'technical': (0, 10),
        'communication': (0, 10),
        'projects': (0, 15),
        'hackathon': (0, 1),
        'internship': (0, 10),  # Added missing field
        'resume': (1, 10)
    }
    
    # Validate and clean each field
    for field, (min_val, max_val) in field_ranges.items():
        if field in input_data:
            try:
                value = float(input_data[field])
                # Clamp values to valid ranges
                value = max(min_val, min(max_val, value))
                validated_data[field] = value
            except (ValueError, TypeError):
                # Use default value if invalid
                validated_data[field] = min_val
        else:
            # Use default value if missing
            validated_data[field] = min_val
    
    # Handle branch field
    valid_branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'ISE', 'AI&DS']
    branch = input_data.get('branch', 'CSE')
    if branch not in valid_branches:
        branch = 'CSE'  # Default to CSE if invalid
    validated_data['branch'] = branch
    
    return validated_data

_placement_model = None
_company_model = None
_scaler = None
_feature_cols = None


def _ensure_models_loaded():
    global _placement_model, _company_model, _scaler, _feature_cols
    if _placement_model is None or _company_model is None or _scaler is None or _feature_cols is None:
        try:
            _placement_model = joblib.load("placement_model.pkl")
            _company_model = joblib.load("company_fit_model.pkl")
            _scaler = joblib.load("scaler.pkl")
            _feature_cols = joblib.load("feature_columns.pkl")
        except Exception as e:
            print(f"Warning: Could not load ML models: {e}")
            # Use fallback - models will remain None and we'll use rule-based prediction
            pass


def predict_score(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predict placement readiness and company fit based on input data
    
    Args:
        input_data: Dictionary containing student information
        
    Returns:
        Dictionary with placement_readiness and company_fit predictions
    """
    try:
        # Load models and preprocessing objects once
        _ensure_models_loaded()
        
        # Validate and clean input data
        validated_data = validate_input_data(input_data)
        
        # Create DataFrame
        df = pd.DataFrame([validated_data])
        
        # Handle categorical variables (one-hot encoding)
        df_encoded = pd.get_dummies(df)
        
        # Make predictions - use ML models if available, otherwise use rule-based approach
        if _placement_model is not None and _scaler is not None and _feature_cols is not None:
            # Ensure all expected features are present
            for col in _feature_cols:
                if col not in df_encoded.columns:
                    df_encoded[col] = 0
            
            # Reorder columns to match training data
            df_encoded = df_encoded.reindex(columns=_feature_cols, fill_value=0)
            
            # Scale features
            scaled_input = _scaler.transform(df_encoded)
            
            placement_prediction = int(_placement_model.predict(scaled_input)[0])
            placement_proba = _placement_model.predict_proba(scaled_input)[0]
            placement_confidence = max(placement_proba) * 100
        else:
            # Fallback to rule-based prediction
            placement_confidence = 85.0  # Default confidence
        
        # Branch-based scoring adjustment
        branch_weights = {
            'CSE': 5.0,
            'AI&DS': 5.0,
            'ISE': 4.5,
            'ECE': 4.0,
            'MECH': 3.5,
            'CIVIL': 3.5
        }

        # Calculate a more nuanced score based on input data
        calculated_score = (
            validated_data['cgpa'] * 6.0 +           # Increased CGPA importance
            validated_data['certifications'] * 2.0 +  # Slightly increased
            validated_data['internship'] * 8.0 +      # Significantly increased for real experience
            validated_data['projects'] * 3.0 +        # More weight on projects
            validated_data['aptitude'] * 2.5 +        # Increased aptitude importance
            validated_data['technical'] * 4.0 +       # Doubled technical importance
            validated_data['communication'] * 3.0 +   # Doubled communication importance
            validated_data['resume'] * 1.5 +          # Slightly increased
            validated_data['hackathon'] * 3.0 +      # Increased hackathon value
            validated_data['backlogs'] * (-4.0) +    # Doubled backlog penalty
            branch_weights.get(validated_data['branch'], 3.0)  # Branch-specific bonus
        )
        
        # Normalize score to 0-100 range with better distribution
        max_possible_score = (
            10.0 * 6.0 +    # Max CGPA
            20.0 * 2.0 +    # Max certifications
            10.0 * 8.0 +    # Max internships
            15.0 * 3.0 +    # Max projects
            10.0 * 2.5 +    # Max aptitude
            10.0 * 4.0 +    # Max technical
            10.0 * 3.0 +    # Max communication
            10.0 * 1.5 +    # Max resume
            1.0 * 3.0 +     # Max hackathon
            5.0            # Max branch weight
        )
        
        # Normalize score to 0-100 range
        calculated_score = (calculated_score / max_possible_score) * 100
        calculated_score = max(0, min(100, calculated_score))
        
        # Determine placement readiness and company fit based on calculated score
        min_cgpa = 6.5
        min_score = 30.0
        max_backlogs = 3
        
        placement_prediction = 1 if (
            calculated_score >= min_score and 
            validated_data['cgpa'] >= min_cgpa and 
            validated_data['backlogs'] <= max_backlogs
        ) else 0
        
        # Determine company fit based on calculated score and other factors
        if placement_prediction == 1:
            if calculated_score >= 45 and validated_data['cgpa'] >= 8.5 and validated_data['backlogs'] <= 1:
                company_fit = "Tier 1"
            elif calculated_score >= 35 and validated_data['cgpa'] >= 7.5 and validated_data['backlogs'] <= 2:
                company_fit = "Tier 2"
            elif calculated_score >= 30 and validated_data['cgpa'] >= 6.5:
                company_fit = "Tier 3"
            else:
                company_fit = "Not Eligible"
        else:
            company_fit = "Not Eligible"
            
        return {
            "placement_readiness": placement_prediction,
            "company_fit": company_fit,
            "placement_confidence": round(placement_confidence, 2),
            "calculated_score": round(calculated_score, 2),
            "input_validated": True
        }
        
    except FileNotFoundError as e:
        print(f"Model file not found: {e}")
        return {
            "placement_readiness": None,
            "company_fit": "Error - Models not found",
            "placement_confidence": 0,
            "company_confidence": 0,
            "calculated_score": 0,
            "input_validated": False,
            "error": "Model files not found. Please ensure models are trained."
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return {
            "placement_readiness": None,
            "company_fit": "Error",
            "placement_confidence": 0,
            "company_confidence": 0,
            "calculated_score": 0,
            "input_validated": False,
            "error": f"Prediction failed: {str(e)}"
        }

def get_feature_importance() -> Dict[str, Any]:
    """Get feature importance from trained models"""
    try:
        _ensure_models_loaded()
        
        placement_importance = dict(zip(_feature_cols, _placement_model.feature_importances_))
        company_importance = dict(zip(_feature_cols, _company_model.feature_importances_))
        
        return {
            "placement_importance": placement_importance,
            "company_importance": company_importance
        }
    except Exception as e:
        print(f"Error getting feature importance: {e}")
        return {"error": str(e)}
