from flask import Blueprint
from .models import db, User, Candidate

bp = Blueprint("public", __name__)

def user_json(u: User):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "mobile": u.mobile,
        "role": u.role,
    }

def cand_json(c: Candidate):
    creator = None
    try:
        creator = {
            "id": c.created_by.id,
            "name": c.created_by.name,
            "email": c.created_by.email,
        }
    except Exception:
        # Fallback if relationship name differs; feel free to adjust
        creator = {"id": c.created_by_user_id}

    return {
        "id": c.id,
        "first_name": c.first_name,
        "last_name":  c.last_name,
        "email": c.email,
        "phone": c.phone,
        "created_by": creator,
    }

@bp.get("/users")
def public_users():
    users = User.query.order_by(User.id.asc()).all()
    return {"users": [user_json(u) for u in users]}

@bp.get("/candidates")
def public_candidates():
    cands = Candidate.query.order_by(Candidate.id.desc()).all()
    return {"candidates": [cand_json(c) for c in cands]}
