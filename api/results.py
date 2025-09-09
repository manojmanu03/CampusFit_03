from flask import Blueprint, jsonify, g, request
from services.mongo_client import get_db
from utils.auth import require_auth
from score_predictor import predict_score
from utils.personalized_recommendations import generate_personalized_recommendations

results_bp = Blueprint('results_bp', __name__, url_prefix='/api/results')

db = get_db()
profiles = db.profiles
sessions = db.test_sessions


def _safe_int(v, d=0):
    try:
        return int(v)
    except Exception:
        try:
            return int(float(v))
        except Exception:
            return d


def _safe_float(v, d=0.0):
    try:
        return float(v)
    except Exception:
        return d


@results_bp.get('')
@require_auth
def get_results():
    user_id = g.user.get('sub')
    profile = profiles.find_one({'user_id': user_id}) or {}

    # pull latest test scores if present
    tests = {doc['type'].lower(): doc for doc in sessions.find({'user_id': user_id})}
    aptitude = _safe_int((tests.get('APTITUDE') or {}).get('score', (tests.get('aptitude') or {}).get('score', 0)))
    technical = _safe_int((tests.get('TECHNICAL') or {}).get('score', (tests.get('technical') or {}).get('score', 0)))
    communication = _safe_int((tests.get('COMMUNICATION') or {}).get('score', (tests.get('communication') or {}).get('score', 0)))

    payload = {
        'cgpa': _safe_float(profile.get('cgpa', 0)),
        'backlogs': _safe_int(profile.get('backlogs', 0)),
        'certifications': _safe_int(profile.get('certifications', 0)),
        'internship': _safe_int(profile.get('internship', 0)),
        'projects': _safe_int(profile.get('projects', 0)),
        'hackathon': _safe_int(profile.get('hackathon', 0)),
        'branch': profile.get('branch', 'CSE') or 'CSE',
        'aptitude': aptitude,
        'technical': technical,
        'communication': communication,
        'resume': _safe_float(profile.get('resume', profile.get('resume_score', 0)) or 0) / 10.0,  # Convert percentage to 0-10 scale
    }

    pred = predict_score(payload)
    recommendations = generate_personalized_recommendations(payload)
    return jsonify({'input': payload, 'prediction': pred, 'recommendations': recommendations})
