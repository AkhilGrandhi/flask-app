from flask import Blueprint, request, abort
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.security import generate_password_hash
from .models import db, User, Candidate

bp = Blueprint("admin", __name__)

def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        abort(403, description="Admin only")

# ---- Users ----
@bp.get("/users")
@jwt_required()
def list_users():
    require_admin()
    users = User.query.order_by(User.id.asc()).all()
    return {"users": [u.to_dict() for u in users]}

@bp.post("/users")
@jwt_required()
def create_user():
    require_admin()
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()
    mobile = (data.get("mobile") or "").strip()
    password = data.get("password")
    role = data.get("role", "user")
    if not all([name, email, mobile, password]) or role not in {"user", "admin"}:
        return {"message":"Invalid input"}, 400
    if User.query.filter((User.email==email)|(User.mobile==mobile)).first():
        return {"message":"Email or mobile already exists"}, 409
    user = User(name=name, email=email, mobile=mobile,
                password_hash=generate_password_hash(password), role=role)
    db.session.add(user); db.session.commit()
    return {"message":"User created", "id": user.id}, 201

@bp.put("/users/<int:user_id>")
@jwt_required()
def update_user(user_id):
    require_admin()
    u = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    if "name" in data: u.name = data["name"].strip()
    if "email" in data: u.email = data["email"].lower().strip()
    if "mobile" in data: u.mobile = data["mobile"].strip()
    if "role" in data and data["role"] in {"user","admin"}: u.role = data["role"]
    if "password" in data and data["password"]:
        u.password_hash = generate_password_hash(data["password"])
    db.session.commit()
    return {"message":"User updated"}

@bp.delete("/users/<int:user_id>")
@jwt_required()
def delete_user(user_id):
    require_admin()
    u = User.query.get_or_404(user_id)
    db.session.delete(u); db.session.commit()
    return {"message":"User deleted"}

# ---- Candidates (admin view) ----
@bp.get("/candidates")
@jwt_required()
def list_all_candidates():
    require_admin()
    cs = Candidate.query.order_by(Candidate.id.desc()).all()
    return {"candidates":[c.to_dict(include_creator=True) for c in cs]}

@bp.put("/candidates/<int:cand_id>")
@jwt_required()
def admin_update_candidate(cand_id):
    require_admin()
    c = Candidate.query.get_or_404(cand_id)
    data = request.get_json() or {}
    for field in [
        "first_name","last_name","email","phone","gender","nationality","citizenship_status",
        "visa_status","work_authorization","veteran_status","race_ethnicity","address_line1",
        "address_line2","city","state","postal_code","country","personal_website","linkedin",
        "github","technical_skills","work_experience"
    ]:
        if field in data: setattr(c, field, data[field])
    # booleans
    for field in ["willing_relocate","willing_travel","disability_status","military_experience"]:
        if field in data: setattr(c, field, bool(data[field]))
    # birthdate (YYYY-MM-DD)
    if "birthdate" in data and data["birthdate"]:
        from datetime import date
        y,m,d = map(int, data["birthdate"].split("-")); c.birthdate = date(y,m,d)
    db.session.commit()
    return {"message":"Candidate updated"}

@bp.delete("/candidates/<int:cand_id>")
@jwt_required()
def admin_delete_candidate(cand_id):
    require_admin()
    c = Candidate.query.get_or_404(cand_id)
    db.session.delete(c); db.session.commit()
    return {"message":"Candidate deleted"}
