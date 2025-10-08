import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-change-me")

    # Web UI uses cookies; Extension uses headers
    JWT_TOKEN_LOCATION = ["cookies", "headers"]
    JWT_HEADER_NAME = "Authorization"  # default; can be omitted
    JWT_HEADER_TYPE = "Bearer"         # default; can be omitted

    # Cookies (web only)
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_SAMESITE = "Lax"
    JWT_COOKIE_CSRF_PROTECT = False  # keep False in dev

    # (optional) make tokens last longer while testing
    # from datetime import timedelta
    # JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
