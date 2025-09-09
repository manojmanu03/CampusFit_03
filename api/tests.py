from flask import Blueprint, request, jsonify, g
from services.mongo_client import get_db
from utils.auth import require_auth
from datetime import datetime

tests_bp = Blueprint('tests_bp', __name__, url_prefix='/api/tests')

db = get_db()
sessions = db.test_sessions
sessions.create_index([('user_id', 1), ('type', 1)])


# Compute score: count matches of selected against correct
# answers payload example: [{"questionId": "...", "selected": "option text", "correct": "option text"}, ...]
def _calculate_score(items):
    score = 0
    details = []
    for idx, it in enumerate(items or [], start=1):
        sel = (it.get('selected') or '').strip()
        cor = (it.get('correct') or '').strip()
        correct = bool(sel and cor and sel == cor)
        if correct:
            score += 1
        details.append({
            'q': idx,
            'selected': sel,
            'correct': cor,
            'is_correct': correct,
        })
    return score, details


@tests_bp.post('/<test_type>')
@require_auth
def submit_test(test_type: str):
    data = request.get_json(force=True) or {}
    answers = data.get('answers') or []
    score, details = _calculate_score(answers)
    doc = {
        'user_id': g.user.get('sub'),
        'type': test_type.upper(),
        'score': int(score),
        'details': details,
        'submitted_at': datetime.utcnow(),
    }
    sessions.update_one({'user_id': doc['user_id'], 'type': doc['type']}, {'$set': doc}, upsert=True)
    return jsonify({'score': score})


@tests_bp.get('')
@require_auth
def get_overview():
    user_id = g.user.get('sub')
    docs = list(sessions.find({'user_id': user_id}, {'_id': 0}))
    return jsonify({'tests': docs})
