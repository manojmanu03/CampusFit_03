from pymongo import MongoClient
from typing import Optional
from config import settings

_client: Optional[MongoClient] = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI)
    return _client


def get_db():
    return get_mongo_client()[settings.MONGO_DB]
