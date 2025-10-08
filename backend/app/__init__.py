import os
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from .models import db, User
from flask_cors import CORS

migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Allow the extension to call our API (no cookies; we’ll use Bearer token)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

    # Blueprints
    from .auth import bp as auth_bp
    from .admin import bp as admin_bp
    from .candidates import bp as cand_bp
    from .ai import bp as ai_bp
    from .public import bp as public_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(cand_bp, url_prefix="/api/candidates")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(public_bp, url_prefix="/api/public")

    @app.get("/api/healthz")
    def health():
        return {"status": "ok"}

    # Default admin bootstrap (one-time)
    with app.app_context():
        db.create_all()
        email = os.getenv("ADMIN_EMAIL", "admin@example.com").lower()
        password = os.getenv("ADMIN_PASSWORD", "Passw0rd!")
        mobile = os.getenv("ADMIN_MOBILE", "9999999999")
        name = os.getenv("ADMIN_NAME", "Administrator")
        admin = User.query.filter_by(email=email).first()
        if not admin:
            admin = User(name=name, email=email, mobile=mobile,
                         password_hash=generate_password_hash(password), role="admin")
            db.session.add(admin); db.session.commit()
            app.logger.info(f"Default admin created: {email}")

    return app
