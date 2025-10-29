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
    users_data = []
    for u in users:
        user_dict = u.to_dict()
        # Count candidates created by this user
        candidate_count = Candidate.query.filter_by(created_by_user_id=u.id).count()
        user_dict['candidate_count'] = candidate_count
        users_data.append(user_dict)
    return {"users": users_data}

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
    
    # Validate mobile number - only digits allowed
    if not mobile.isdigit():
        return {"message": "Mobile number must contain only numbers"}, 400
    
    # Validate password length - minimum 6 characters
    if len(password) < 6:
        return {"message": "Password must be at least 6 characters"}, 400
    
    # Check if email already exists
    existing_email = User.query.filter(User.email == email).first()
    if existing_email:
        return {"message": "Email already exists"}, 409
    
    # Check if mobile number already exists
    existing_mobile = User.query.filter(User.mobile == mobile).first()
    if existing_mobile:
        return {"message": "Mobile number already exists"}, 409
    
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
    
    # Validate email if being updated
    if "email" in data:
        new_email = data["email"].lower().strip()
        existing_email = User.query.filter(User.email == new_email, User.id != user_id).first()
        if existing_email:
            return {"message": "Email already exists"}, 409
        u.email = new_email
    
    # Validate mobile if being updated
    if "mobile" in data:
        new_mobile = data["mobile"].strip()
        # Validate mobile number - only digits allowed
        if not new_mobile.isdigit():
            return {"message": "Mobile number must contain only numbers"}, 400
        existing_mobile = User.query.filter(User.mobile == new_mobile, User.id != user_id).first()
        if existing_mobile:
            return {"message": "Mobile number already exists"}, 409
        u.mobile = new_mobile
    
    if "name" in data: u.name = data["name"].strip()
    if "role" in data and data["role"] in {"user","admin"}: u.role = data["role"]
    if "password" in data and data["password"]:
        new_password = data["password"]
        # Validate password length - minimum 6 characters
        if len(new_password) < 6:
            return {"message": "Password must be at least 6 characters"}, 400
        u.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return {"message":"User updated"}

@bp.delete("/users/<int:user_id>")
@jwt_required()
def delete_user(user_id):
    require_admin()
    u = User.query.get_or_404(user_id)
    db.session.delete(u); db.session.commit()
    return {"message":"User deleted"}

@bp.get("/users/<int:user_id>/candidates")
@jwt_required()
def get_user_candidates(user_id):
    require_admin()
    # Verify user exists
    u = User.query.get_or_404(user_id)
    # Get all candidates created by this user
    candidates = Candidate.query.filter_by(created_by_user_id=user_id).order_by(Candidate.id.desc()).all()
    return {"user": u.to_dict(), "candidates": [c.to_dict(include_jobs=True) for c in candidates]}

# ---- Candidates (admin view) ----
@bp.get("/candidates")
@jwt_required()
def list_all_candidates():
    require_admin()
    cs = Candidate.query.order_by(Candidate.id.desc()).all()
    return {"candidates":[c.to_dict(include_creator=True, include_jobs=True) for c in cs]}

@bp.put("/candidates/<int:cand_id>")
@jwt_required()
def admin_update_candidate(cand_id):
    require_admin()
    c = Candidate.query.get_or_404(cand_id)
    data = request.get_json() or {}
    
    # Validate and update creator if provided
    if "created_by_user_id" in data:
        new_creator_id = data.get("created_by_user_id")
        if new_creator_id:
            creator_user = User.query.get(new_creator_id)
            if not creator_user:
                return {"message": "Assigned user not found"}, 404
            c.created_by_user_id = new_creator_id
    
    # Handle assigned users (admin only)
    if "assigned_user_ids" in data:
        assigned_user_ids = data.get("assigned_user_ids", [])
        # Clear existing assignments
        c.assigned_users = []
        # Add new assignments
        if assigned_user_ids:
            for user_id in assigned_user_ids:
                user = User.query.get(user_id)
                if user and user.role == "user":  # Only assign to regular users
                    c.assigned_users.append(user)
    
    # Validate email if being updated
    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        if not email or "@" not in email:
            return {"message": "Valid email is required"}, 400
        
        # Check for duplicate email across all candidates (admin can edit any candidate)
        existing_email = Candidate.query.filter(
            Candidate.email == email,
            Candidate.id != cand_id
        ).first()
        if existing_email:
            return {"message": "A candidate with this email already exists"}, 409
    
    # Validate phone if being updated
    if "phone" in data:
        phone = (data.get("phone") or "").strip()
        if not phone.isdigit():
            return {"message": "Phone number must contain only digits"}, 400
        
        # Check for duplicate phone across all candidates (admin can edit any candidate)
        existing_phone = Candidate.query.filter(
            Candidate.phone == phone,
            Candidate.id != cand_id
        ).first()
        if existing_phone:
            return {"message": "A candidate with this phone number already exists"}, 409
    
    # Validate password if being updated
    if "password" in data and data.get("password"):
        password = data.get("password")
        if len(password) < 6:
            return {"message": "Password must be at least 6 characters"}, 400
    
    for field in [
        "first_name","last_name","email","phone","password","gender","nationality","citizenship_status",
        "visa_status","f1_type","work_authorization","veteran_status","race_ethnicity","address_line1",
        "address_line2","city","state","postal_code","country","personal_website","linkedin",
        "github","technical_skills","work_experience","subscription_type",

        # NEW
        "expected_wage","contact_current_employer","recent_degree","authorized_work_us",
        "authorized_without_sponsorship","referral_source","at_least_18",
        "needs_visa_sponsorship","family_in_org","availability","education","certificates"
    ]:
        if field in data: setattr(c, field, data[field])
        
    # booleans - convert Yes/No to boolean
    def to_bool(val):
        if isinstance(val, bool):
            return val
        if isinstance(val, str):
            return val.lower() in ("yes", "true", "1")
        return bool(val)
    
    for field in ["willing_relocate","willing_travel","disability_status","military_experience"]:
        if field in data: setattr(c, field, to_bool(data[field]))
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
