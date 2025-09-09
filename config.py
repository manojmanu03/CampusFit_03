import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Flask
    FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY', os.urandom(32).hex())
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # MongoDB - Updated for production compatibility
    MONGO_URI = os.getenv('MONGODB_URI', os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
    MONGO_DB = os.getenv('MONGO_DB', 'campusfit')

    # JWT - Updated variable names for consistency
    JWT_SECRET = os.getenv('JWT_SECRET_KEY', os.getenv('JWT_SECRET', os.urandom(32).hex()))
    JWT_EXPIRES_SECONDS = int(os.getenv('JWT_EXPIRES_SECONDS', '86400'))  # 1 day

    # Uploads - Production-ready paths
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/tmp/uploads' if os.getenv('FLASK_ENV') == 'production' else 'static/uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', str(16 * 1024 * 1024)))  # 16MB

    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')

    # Brevo (Sendinblue) transactional email
    BREVO_API_KEY = os.getenv('BREVO_API_KEY', '')
    BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'no-reply@example.com')
    BREVO_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', 'CampusFit')

    # Production settings
    @property
    def is_production(self):
        return self.FLASK_ENV == 'production'

settings = Settings()
