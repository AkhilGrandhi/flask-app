# backend/app/public.py
from flask import Blueprint
from .models import db, User, Candidate
from .utils import model_to_dict

bp = Blueprint("public", __name__)

@bp.get("/users")
def public_users():
    users = User.query.order_by(User.id.asc()).all()
    # Users have passwords; exclude them here.
    payload = [model_to_dict(u, exclude={"password_hash"}) for u in users]
    return {"users": payload}

@bp.get("/candidates")
def public_candidates():
    # Brief list (keep it light; exclude big text if you like)
    cands = Candidate.query.order_by(Candidate.id.desc()).all()
    def brief(c):
        d = model_to_dict(
            c,
            # Optional: shrink list payload
            exclude=set()
        )
        # Normalize creator
        creator_id = getattr(c, "created_by_user_id", None)
        d["created_by"] = {"id": creator_id}
        return d
    return {"candidates": [brief(c) for c in cands]}

@bp.get("/candidates/<int:cand_id>")
def public_candidate_one(cand_id):
    c = Candidate.query.get_or_404(cand_id)
    d = model_to_dict(c)  # Candidate has no password fields
    # Add creator detail if relationship is available; else id only
    if getattr(c, "created_by", None):
        d["created_by"] = model_to_dict(c.created_by, exclude={"password_hash"})
    else:
        d["created_by"] = {"id": getattr(c, "created_by_user_id", None)}
    return {"candidate": d}
