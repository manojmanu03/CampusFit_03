from flask import Blueprint, request, jsonify, g
from services.mongo_client import get_db
from utils.auth import require_auth
from datetime import datetime

profile_bp = Blueprint('profile_bp', __name__, url_prefix='/api/profile')

db = get_db()
profiles = db.profiles
profiles.create_index('user_id')


@profile_bp.route('', methods=['POST', 'OPTIONS'])
@require_auth
def save_profile():
    if request.method == 'OPTIONS':
        return ('', 204)
    data = request.get_json(force=True) or {}
    # expected keys: cgpa, backlogs, certifications, internship, aptitude, technical, communication, projects, hackathon, resume, branch
    doc = {
        'user_id': g.user.get('sub'),
        'cgpa': float(data.get('cgpa', 0)),
        'backlogs': int(data.get('backlogs', 0)),
        'certifications': int(data.get('certifications', 0)),
        'internship': int(data.get('internship', 0)),
        'projects': int(data.get('projects', 0)),
        'hackathon': int(data.get('hackathon', 0)),
        'branch': (data.get('branch') or 'CSE'),
        'updated_at': datetime.utcnow(),
    }
    profiles.update_one({'user_id': doc['user_id']}, {'$set': doc}, upsert=True)
    return jsonify({'ok': True})


@profile_bp.route('', methods=['GET', 'OPTIONS'])
@require_auth
def get_profile():
    if request.method == 'OPTIONS':
        return ('', 204)
    p = profiles.find_one({'user_id': g.user.get('sub')}, {'_id': 0})
    return jsonify(p or {})
