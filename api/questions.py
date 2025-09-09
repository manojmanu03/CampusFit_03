from flask import Blueprint, jsonify, request
from services.mongo_client import get_db
from random import sample
from typing import List
from bson.objectid import ObjectId

questions_bp = Blueprint('questions_bp', __name__, url_prefix='/api/questions')

db = get_db()
coll = db.questions
coll.create_index([('category', 1)])


def _format(q):
    return {
        'id': str(q.get('_id')),
        'category': q.get('category'),
        'question': q.get('question'),
        'options': q.get('options', []),
        'correct_letter': q.get('correct_letter'),  # returned only for admin/internal if needed
    }


@questions_bp.get('/<category>')
def get_questions(category: str):
    # Fetch 30 random questions from Mongo; fallback to CSV loader if empty
    docs: List[dict] = list(coll.find({'category': category.upper()}))
    if not docs:
        return jsonify({'questions': []}), 200

    k = min(30, len(docs))
    picked = sample(docs, k)
    return jsonify({'questions': [_format(d) for d in picked]})


@questions_bp.get('/byid/<qid>')
def get_question_by_id(qid: str):
    try:
        q = coll.find_one({'_id': ObjectId(qid)})
        if not q:
            return jsonify({'error': 'Not found'}), 404
        return jsonify(_format(q))
    except Exception:
        return jsonify({'error': 'Invalid id'}), 400
