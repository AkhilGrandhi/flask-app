import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
# Get the directory where this config.py file is located
basedir = Path(__file__).resolve().parent
dotenv_path = basedir / '.env'

# Load with override=True to ensure it loads even if vars already exist
load_dotenv(dotenv_path, override=True)

# Debug: Verify DATABASE_URL is loaded
if not os.getenv("DATABASE_URL"):
    # Try loading from current working directory as fallback
    load_dotenv('.env', override=True)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-change-me")
    # Require DATABASE_URL to be set - no SQLite fallback
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or "postgresql://postgres:admin@localhost:5432/flask_app_db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-change-me")

    # Web UI uses cookies; Extension uses headers
    JWT_TOKEN_LOCATION = ["cookies", "headers"]
    JWT_HEADER_NAME = "Authorization"  # default; can be omitted
    JWT_HEADER_TYPE = "Bearer"         # default; can be omitted

    # Cookies (web only)
    # Use secure cookies in production (HTTPS), regular in development
    is_development = os.getenv("FLASK_ENV") == "development"
    JWT_COOKIE_SECURE = not is_development  # True in production, False in dev
    # SameSite=None required for cross-origin cookies (frontend and backend on different domains)
    JWT_COOKIE_SAMESITE = "Lax" if is_development else "None"  # Lax in dev, None in production
    JWT_COOKIE_CSRF_PROTECT = False

    # (optional) make tokens last longer while testing
    # from datetime import timedelta
    # JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
