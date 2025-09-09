from functools import wraps
from flask import request, jsonify, g
from utils.jwt_utils import verify_jwt


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Allow CORS preflight without auth
        if request.method == 'OPTIONS':
            return fn(*args, **kwargs)
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        token = auth.split(' ', 1)[1].strip()
        try:
            payload = verify_jwt(token)
            g.user = payload
        except Exception:
            return jsonify({'error': 'Invalid or expired token'}), 401
        return fn(*args, **kwargs)
    return wrapper
