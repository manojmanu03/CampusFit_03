"""
Import question CSVs into MongoDB for dynamic rotation.

Usage:
  python scripts/import_questions.py

Env required (see .env.example):
  MONGO_URI, MONGO_DB

CSV formats expected:
  - data/Apquestions.csv        (delimiter=';') columns: question, opt1, opt2, opt3, opt4, correct_letter
  - data/TechnicalQuestions.csv (delimiter=',') columns: question, opt1, opt2, opt3, opt4, correct_letter
  - data/CommunicationAssess.csv(delimiter=',') columns: question, opt1, opt2, opt3, opt4, correct_letter
"""
import os
import csv
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
import argparse

# Always load .env from the project root, even when running from scripts/
ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / '.env'
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    # Fallback to current working directory .env if present
    load_dotenv()

parser = argparse.ArgumentParser(description='Import question CSVs into MongoDB')
parser.add_argument('--uri', dest='uri', default=os.getenv('MONGO_URI', ''), help='MongoDB URI (overrides env)')
parser.add_argument('--db', dest='db', default=os.getenv('MONGO_DB', 'campusfit'), help='MongoDB database name')
args = parser.parse_args()

MONGO_URI = args.uri or os.getenv('MONGO_URI', '')
MONGO_DB = args.db

if not MONGO_URI:
    print('ERROR: MONGO_URI is not set. Create a .env at project root or pass --uri.')
    raise SystemExit(1)

print(f"Connecting to MongoDB at: {MONGO_URI}")
client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
coll = db.questions
coll.create_index([('category', 1)])

DATA = ROOT / 'data'

files = [
    ('APTITUDE', DATA / 'Apquestions.csv', ';'),
    ('TECHNICAL', DATA / 'TechnicalQuestions.csv', ','),
    ('COMMUNICATION', DATA / 'CommunicationAssess.csv', ','),
]

inserted = 0
for category, path, delim in files:
    if not path.exists():
        print(f"Skip: {path} not found")
        continue

    with path.open('r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=delim)
        # try skip header if headers present
        first = next(reader, None)
        if not first:
            continue
        # detect header by checking if 'question' in first cell (case-insensitive)
        if not first or 'question' in (first[0] or '').lower():
            rows_iter = reader
        else:
            rows_iter = [first] + list(reader)

        docs = []
        for row in rows_iter:
            if len(row) < 6:
                continue
            question = row[0].strip()
            options = [row[1].strip(), row[2].strip(), row[3].strip(), row[4].strip()]
            correct_letter = row[5].strip().lower()[:1]
            doc = {
                'category': category,
                'question': question,
                'options': options,
                'correct_letter': correct_letter,
            }
            docs.append(doc)
        if docs:
            # upsert by question text+category to avoid duplicates
            for d in docs:
                coll.update_one(
                    {'category': d['category'], 'question': d['question']},
                    {'$set': d},
                    upsert=True,
                )
            inserted += len(docs)
            print(f"Imported {len(docs)} docs for {category}")

print(f"Done. Total upserted ~{inserted}")
