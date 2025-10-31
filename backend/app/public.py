# backend/app/public.py
from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from .models import db, User, Candidate
from .utils import model_to_dict

bp = Blueprint("public", __name__)

def is_admin():
    """Check if current user is admin"""
    claims = get_jwt()
    return claims.get("role") == "admin"

def current_user_id():
    """Get current user's ID as integer"""
    return int(get_jwt_identity())

@bp.get("/users")
@jwt_required()
def public_users():
    """List users - admin sees all, regular users see only non-admin users"""
    if is_admin():
        # Admins can see all users
        users = User.query.order_by(User.id.asc()).all()
    else:
        # Regular users can only see non-admin users (for dropdown purposes)
        users = User.query.filter(User.role != "admin").order_by(User.id.asc()).all()
    
    payload = [model_to_dict(u, exclude={"password_hash"}) for u in users]
    return {"users": payload}

@bp.get("/candidates")
@jwt_required()
def public_candidates():
    """List candidates - users see only their own, admins see all"""
    uid = current_user_id()
    
    if is_admin():
        # Admins see all candidates
        cands = Candidate.query.order_by(Candidate.id.desc()).all()
    else:
        # Regular users see only their own candidates
        cands = Candidate.query.filter_by(created_by_user_id=uid).order_by(Candidate.id.desc()).all()
    
    def brief(c):
        d = model_to_dict(c, exclude=set())
        creator_id = getattr(c, "created_by_user_id", None)
        d["created_by"] = {"id": creator_id}
        return d
    
    return {"candidates": [brief(c) for c in cands]}

@bp.get("/candidates/<int:cand_id>")
@jwt_required()
def public_candidate_one(cand_id):
    """Get single candidate - users can only access their own, admins can access all"""
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    
    # Authorization check: users can only access their own candidates
    if not is_admin() and c.created_by_user_id != uid:
        return {"message": "Access denied"}, 403
    
    d = model_to_dict(c)
    # Add creator detail if relationship is available
    if getattr(c, "created_by", None):
        d["created_by"] = model_to_dict(c.created_by, exclude={"password_hash"})
    else:
        d["created_by"] = {"id": getattr(c, "created_by_user_id", None)}
    
    return {"candidate": d}
