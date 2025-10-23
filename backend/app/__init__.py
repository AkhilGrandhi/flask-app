import os
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from flask_cors import CORS

# Import your SQLAlchemy handle and models once (no duplicates)
from .models import db, User

migrate = Migrate()
jwt = JWTManager()

def create_app():
    # instance_relative_config=True lets us use the /instance folder cleanly
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object("config.Config")

    # Ensure database URI is configured
    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        raise RuntimeError("SQLALCHEMY_DATABASE_URI is not configured. Check your config.py and .env file.")

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Allow your React app / extension to call the API in dev
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS(app, 
     resources={r"/api/*": {
         "origins": [
             "http://localhost:5173",
             "http://localhost:3000",
             frontend_url
         ]
     }}, 
     supports_credentials=True)

    # Blueprints
    from .auth import bp as auth_bp
    from .admin import bp as admin_bp
    from .candidates import bp as cand_bp
    from .ai import bp as ai_bp
    from .public import bp as public_bp
    from .candidateresumebuilder import bp as resume_bp

    app.register_blueprint(auth_bp,  url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(cand_bp,  url_prefix="/api/candidates")
    app.register_blueprint(ai_bp,    url_prefix="/api/ai")
    app.register_blueprint(public_bp, url_prefix="/api/public")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")

    @app.get("/api/healthz")
    def health():
        return {"status": "ok"}

    # One-time dev bootstrap: create tables (if no migrations ran) and seed admin
    with app.app_context():
        # You can remove this create_all once you fully use Alembic migrations
        db.create_all()

        email    = os.getenv("ADMIN_EMAIL", "admin@example.com").lower().strip()
        password = os.getenv("ADMIN_PASSWORD", "Passw0rd!")
        mobile   = os.getenv("ADMIN_MOBILE", "9999999999")
        name     = os.getenv("ADMIN_NAME", "Administrator")

        if not User.query.filter_by(email=email).first():
            admin = User(
                name=name,
                email=email,
                mobile=mobile,
                password_hash=generate_password_hash(password),
                role="admin",
            )
            db.session.add(admin)
            db.session.commit()
            app.logger.info(f"Default admin created: {email}")

    return app
