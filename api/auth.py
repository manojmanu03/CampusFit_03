from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from services.mongo_client import get_db
from utils.jwt_utils import create_jwt
from datetime import datetime

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')

db = get_db()
users = db.users
users.create_index('username', unique=True)
users.create_index('email', unique=True)


@auth_bp.post('/register')
def register():
    data = request.get_json(force=True)
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    try:
        users.insert_one({
            'username': username,
            'email': email,
            'password_hash': generate_password_hash(password),
            'created_at': datetime.utcnow()
        })
        return jsonify({'ok': True}), 201
    except Exception as e:
        return jsonify({'error': 'User exists or DB error', 'detail': str(e)}), 409


@auth_bp.post('/login')
def login():
    data = request.get_json(force=True)
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    user = users.find_one({'username': username})
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_jwt({'sub': str(user['_id']), 'username': username})
    return jsonify({'token': token, 'username': username})
