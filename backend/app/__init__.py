import os
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Import your SQLAlchemy handle and models once (no duplicates)
from .models import db, User

migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",  # In-memory rate limiting (works without Redis)
)

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
    limiter.init_app(app)

    # CORS Configuration - secure for production
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    is_dev = os.getenv("FLASK_ENV") == "development"
    
    # Auto-detect localhost for development
    database_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if not is_dev and ("localhost" in database_uri or "127.0.0.1" in database_uri):
        is_dev = True
    
    if is_dev:
        # Development: allow localhost origins
        allowed_origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            frontend_url
        ]
    else:
        # Production: only allow configured frontend URL
        allowed_origins = [frontend_url] if frontend_url else []
    
    # Log CORS configuration for debugging
    print(f"🔐 CORS Configuration:")
    print(f"   - Environment: {'Development' if is_dev else 'Production'}")
    print(f"   - Frontend URL: {frontend_url}")
    print(f"   - Allowed Origins: {allowed_origins}")
    app.logger.info(f"CORS configured with origins: {allowed_origins}")
    
    # Enhanced CORS configuration with better preflight handling
    CORS(app, 
         resources={r"/api/*": {
             "origins": allowed_origins,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600,
             "send_wildcard": False,
             "always_send": True
         }})
    
    # Add explicit OPTIONS handler for all API routes
    @app.before_request
    def handle_preflight():
        from flask import request, make_response
        if request.method == "OPTIONS":
            response = make_response()
            response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", frontend_url)
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response, 204

    # Blueprints
    from .auth import bp as auth_bp
    from .admin import bp as admin_bp
    from .candidates import bp as cand_bp
    from .ai import bp as ai_bp
    from .public import bp as public_bp
    from .candidateresumebuilder import bp as resume_bp
    from .resume_async import bp as resume_async_bp

    app.register_blueprint(auth_bp,  url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(cand_bp,  url_prefix="/api/candidates")
    app.register_blueprint(ai_bp,    url_prefix="/api/ai")
    app.register_blueprint(public_bp, url_prefix="/api/public")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(resume_async_bp, url_prefix="/api/resume-async")

    @app.get("/api/healthz")
    def health():
        return {"status": "ok"}
    
    @app.get("/")
    def root():
        """Root endpoint to verify backend is running"""
        return {"message": "Flask App Backend API", "status": "running", "version": "1.0"}
    
    @app.get("/healthz")
    def health_root():
        """Health check at root level"""
        return {"status": "ok"}
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        """Handle 404 errors with proper CORS headers"""
        from flask import request, jsonify
        response = jsonify({"error": "Not Found", "message": f"The requested URL {request.path} was not found on the server."})
        response.status_code = 404
        # Add CORS headers
        origin = request.headers.get("Origin", frontend_url)
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response
    
    @app.errorhandler(500)
    def internal_error(e):
        """Handle 500 errors with proper CORS headers"""
        from flask import request, jsonify
        app.logger.error(f"Internal Server Error: {str(e)}")
        response = jsonify({"error": "Internal Server Error", "message": "An internal error occurred."})
        response.status_code = 500
        # Add CORS headers
        origin = request.headers.get("Origin", frontend_url)
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # One-time dev bootstrap: seed admin user
    with app.app_context():
        # Use migrations instead of create_all() to avoid conflicts
        # Only run create_all() in development if no migrations exist
        try:
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
        except Exception as e:
            app.logger.error(f"Error creating admin user: {e}")
            # If tables don't exist yet, create them (development only)
            if "does not exist" in str(e).lower() or "no such table" in str(e).lower():
                app.logger.info("Tables not found, creating them...")
                db.create_all()
                # Retry admin creation
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
