from flask import Blueprint, request, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from .models import db, Candidate

bp = Blueprint("candidates", __name__)

def current_user_id():
    return int(get_jwt_identity())

def owns_or_404(cand, uid):
    if not cand or cand.created_by_user_id != uid:
        abort(404)

@bp.get("")
@jwt_required()
def list_my_candidates():
    uid = current_user_id()
    cs = Candidate.query.filter_by(created_by_user_id=uid).order_by(Candidate.id.desc()).all()
    return {"candidates":[c.to_dict() for c in cs]}

@bp.post("")
@jwt_required()
def create_candidate():
    uid = current_user_id()
    data = request.get_json() or {}
    required = ["first_name","last_name"]
    if any(not data.get(f) for f in required):
        return {"message":"First & Last name required"}, 400

    c = Candidate(
        created_by_user_id=uid,
        first_name=data.get("first_name"), last_name=data.get("last_name"),
        email=data.get("email"), phone=data.get("phone"),
        gender=data.get("gender"), nationality=data.get("nationality"),
        citizenship_status=data.get("citizenship_status"),
        visa_status=data.get("visa_status"),
        work_authorization=data.get("work_authorization"),
        willing_relocate=bool(data.get("willing_relocate")),
        willing_travel=bool(data.get("willing_travel")),
        disability_status=bool(data.get("disability_status")),
        veteran_status=data.get("veteran_status"),
        military_experience=bool(data.get("military_experience")),
        race_ethnicity=data.get("race_ethnicity"),
        address_line1=data.get("address_line1"), address_line2=data.get("address_line2"),
        city=data.get("city"), state=data.get("state"), postal_code=data.get("postal_code"),
        country=data.get("country"),
        personal_website=data.get("personal_website"),
        linkedin=data.get("linkedin"), github=data.get("github"),
        technical_skills=data.get("technical_skills"),
        work_experience=data.get("work_experience"),
    )
    if data.get("birthdate"):
        from datetime import date
        y,m,d = map(int, data["birthdate"].split("-")); c.birthdate = date(y,m,d)

    db.session.add(c); db.session.commit()
    return {"message":"Candidate created", "id": c.id}, 201

@bp.put("/<int:cand_id>")
@jwt_required()
def update_candidate(cand_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    data = request.get_json() or {}

    for field in [
        "first_name","last_name","email","phone","gender","nationality","citizenship_status",
        "visa_status","work_authorization","veteran_status","race_ethnicity","address_line1",
        "address_line2","city","state","postal_code","country","personal_website","linkedin",
        "github","technical_skills","work_experience"
    ]:
        if field in data: setattr(c, field, data[field])
    for field in ["willing_relocate","willing_travel","disability_status","military_experience"]:
        if field in data: setattr(c, field, bool(data[field]))
    if "birthdate" in data:
        from datetime import date
        if data["birthdate"]:
            y,m,d = map(int, data["birthdate"].split("-")); c.birthdate = date(y,m,d)
        else:
            c.birthdate = None

    db.session.commit()
    return {"message":"Candidate updated"}

@bp.delete("/<int:cand_id>")
@jwt_required()
def delete_candidate(cand_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    db.session.delete(c); db.session.commit()
    return {"message":"Candidate deleted"}
