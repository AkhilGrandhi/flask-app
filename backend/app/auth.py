from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token, set_access_cookies, unset_jwt_cookies,
    jwt_required, get_jwt, get_jwt_identity
)
from .models import db, User, Candidate

bp = Blueprint("auth", __name__)

# Admin login (email + password)
@bp.post("/login-admin")
def login_admin():
    data = request.get_json() or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password) or user.role != "admin":
        return {"message": "Bad credentials"}, 401

    token = create_access_token(identity=str(user.id),
                                additional_claims={"role": user.role, "email": user.email, "mobile": user.mobile, "name":user.name})
    resp = jsonify({"message": "Logged in", "role": user.role})
    set_access_cookies(resp, token)
    return resp, 200

# User login (mobile + password)
@bp.post("/login-user")
def login_user():
    data = request.get_json() or {}
    mobile = (data.get("mobile") or "").strip()
    password = data.get("password")
    user = User.query.filter_by(mobile=mobile).first()
    if not user or not check_password_hash(user.password_hash, password) or user.role != "user":
        return {"message": "Bad credentials"}, 401

    token = create_access_token(identity=str(user.id),
                                additional_claims={"role": user.role, "email": user.email, "mobile": user.mobile, "name":user.name})
    resp = jsonify({"message": "Logged in", "role": user.role})
    set_access_cookies(resp, token)
    return resp, 200

# Candidate login (phone + password)
@bp.post("/login-candidate")
def login_candidate():
    data = request.get_json() or {}
    phone = (data.get("phone") or "").strip()
    password = data.get("password")
    
    candidate = Candidate.query.filter_by(phone=phone).first()
    if not candidate or candidate.password != password:
        return {"message": "Invalid phone number or password"}, 401

    token = create_access_token(
        identity=f"candidate_{candidate.id}",
        additional_claims={
            "role": "candidate",
            "candidate_id": candidate.id,
            "name": f"{candidate.first_name} {candidate.last_name}",
            "email": candidate.email,
            "phone": candidate.phone
        }
    )
    resp = jsonify({"message": "Logged in", "role": "candidate"})
    set_access_cookies(resp, token)
    return resp, 200

@bp.post("/logout")
def logout():
    resp = jsonify({"message": "Logged out"})
    unset_jwt_cookies(resp)
    return resp, 200

@bp.get("/me")
@jwt_required()
def me():
    claims = get_jwt()
    uid = get_jwt_identity()
    role = claims.get("role")
    
    # Handle different identity formats
    if role == "candidate":
        # For candidates, identity is "candidate_{id}"
        user_data = {
            "id": claims.get("candidate_id"),
            "name": claims.get("name"),
            "email": claims.get("email"),
            "phone": claims.get("phone"),
            "mobile": claims.get("phone"),  # Alias for compatibility
            "role": role,
        }
    else:
        # For users and admins, identity is the user ID
        user_data = {
            "id": int(uid),
            "name": claims.get("name"),
            "email": claims.get("email"),
            "mobile": claims.get("mobile"),
            "role": role,
        }
    
    return {"user": user_data}, 200

#chrom extension code
@bp.post("/token-admin")
def token_admin():
    data = request.get_json() or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return {"message": "Bad credentials"}, 401
    # Optional: enforce admin-only
    # if user.role != "admin": return {"message": "Admin only"}, 403

    token = create_access_token(identity=str(user.id),
                                additional_claims={"role": user.role, "email": user.email, "name": user.name, "mobile": user.mobile})
    return {"access_token": token, "role": user.role}

@bp.post("/token-user")
def token_user():
    data = request.get_json() or {}
    mobile = (data.get("mobile") or "").strip()
    password = data.get("password")
    user = User.query.filter_by(mobile=mobile).first()
    if not user or not check_password_hash(user.password_hash, password):
        return {"message": "Bad credentials"}, 401

    token = create_access_token(identity=str(user.id),
                                additional_claims={"role": user.role, "email": user.email, "name": user.name, "mobile": user.mobile})
    return {"access_token": token, "role": user.role}
