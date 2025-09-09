import time
import jwt
from typing import Dict, Any
from config import settings


def create_jwt(payload: Dict[str, Any], expires_in: int = None) -> str:
    if expires_in is None:
        expires_in = settings.JWT_EXPIRES_SECONDS
    data = {**payload, "exp": int(time.time()) + int(expires_in)}
    token = jwt.encode(data, settings.JWT_SECRET, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def verify_jwt(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"]) 
