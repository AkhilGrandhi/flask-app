import os
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from flask_cors import CORS

# Import your SQLAlchemy handle and models once
from .models import db, User

migrate = Migrate()
jwt = JWTManager()

def create_app():
    # instance_relative_config=True lets us use the /instance folder cleanly
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object("config.Config")

    # Ensure instance path exists for SQLite fallback
    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        os.makedirs(app.instance_path, exist_ok=True)
        db_path = os.path.join(app.instance_path, "app.db")
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Setup CORS depending on environment
    if os.getenv("FLASK_ENV") == "production":
        frontend_url = os.getenv("FRONTEND_URL", "")
        CORS(app, resources={r"/api/*": {"origins": frontend_url}}, supports_credentials=True)
    else:
        CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

    # Register blueprints
    from .auth import bp as auth_bp
    from .admin import bp as admin_bp
    from .candidates import bp as cand_bp
    from .ai import bp as ai_bp
    from .public import bp as public_bp

    app.register_blueprint(auth_bp,  url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(cand_bp,  url_prefix="/api/candidates")
    app.register_blueprint(ai_bp,    url_prefix="/api/ai")
    app.register_blueprint(public_bp, url_prefix="/api/public")

    # Health check
    @app.get("/api/healthz")
    def health():
        return {"status": "ok"}

    # One-time bootstrap: create tables & default admin (only if allowed)
    with app.app_context():
        db.create_all()

        email    = os.getenv("ADMIN_EMAIL", "admin@example.com").lower().strip()
        password = os.getenv("ADMIN_PASSWORD", "Passw0rd!")
        mobile   = os.getenv("ADMIN_MOBILE", "9999999999")
        name     = os.getenv("ADMIN_NAME", "Administrator")

        # Only create default admin if explicitly allowed
        if os.getenv("ADMIN_CREATE_ON_BOOT", "false").lower() == "true":
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
