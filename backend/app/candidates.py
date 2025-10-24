# server/candidates.py
from flask import Blueprint, request, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, Candidate, CandidateJob

bp = Blueprint("candidates", __name__)

def current_user_id():
    return int(get_jwt_identity())

def owns_or_404(cand: Candidate, uid: int):
    if not cand or cand.created_by_user_id != uid:
        abort(404)

# Helper function to convert Yes/No strings to boolean
def to_bool(val):
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ("yes", "true", "1")
    return bool(val)

# --------- MY CANDIDATES (list/create/update/delete) ---------

@bp.get("")
@jwt_required()
def list_my_candidates():
    uid = current_user_id()
    cs = Candidate.query.filter_by(created_by_user_id=uid)\
                        .order_by(Candidate.id.desc()).all()
    return {"candidates": [c.to_dict() for c in cs]}

@bp.post("")
@jwt_required()
def create_candidate():
    uid = current_user_id()
    data = request.get_json() or {}
    
    # Validate required fields
    required = ["first_name", "last_name", "email", "phone", "birthdate", "gender", 
                "nationality", "citizenship_status", "visa_status", "work_authorization",
                "address_line1", "address_line2", "city", "state", "postal_code", "country",
                "technical_skills", "work_experience"]
    missing_fields = [f for f in required if not data.get(f)]
    if missing_fields:
        return {"message": f"Required fields missing: {', '.join(missing_fields)}"}, 400
    
    # Validate email format and uniqueness
    email = (data.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return {"message": "Valid email is required"}, 400
    
    existing_email = Candidate.query.filter(
        Candidate.email == email,
        Candidate.created_by_user_id == uid
    ).first()
    if existing_email:
        return {"message": "A candidate with this email already exists"}, 409
    
    # Validate phone number - only digits allowed
    phone = (data.get("phone") or "").strip()
    if not phone.isdigit():
        return {"message": "Phone number must contain only digits"}, 400
    
    existing_phone = Candidate.query.filter(
        Candidate.phone == phone,
        Candidate.created_by_user_id == uid
    ).first()
    if existing_phone:
        return {"message": "A candidate with this phone number already exists"}, 409

    c = Candidate(
        created_by_user_id=uid,
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        gender=data.get("gender"),
        nationality=data.get("nationality"),
        citizenship_status=data.get("citizenship_status"),
        visa_status=data.get("visa_status"),
        work_authorization=data.get("work_authorization"),
        willing_relocate=to_bool(data.get("willing_relocate")),
        willing_travel=to_bool(data.get("willing_travel")),
        disability_status=to_bool(data.get("disability_status")),
        veteran_status=data.get("veteran_status"),
        military_experience=to_bool(data.get("military_experience")),
        race_ethnicity=data.get("race_ethnicity"),
        address_line1=data.get("address_line1"),
        address_line2=data.get("address_line2"),
        city=data.get("city"),
        state=data.get("state"),
        postal_code=data.get("postal_code"),
        country=data.get("country"),
        personal_website=data.get("personal_website"),
        linkedin=data.get("linkedin"),
        github=data.get("github"),
        technical_skills=data.get("technical_skills"),
        work_experience=data.get("work_experience"),
        # NEW extras
        expected_wage=data.get("expected_wage"),
        contact_current_employer=data.get("contact_current_employer"),
        recent_degree=data.get("recent_degree"),
        authorized_work_us=data.get("authorized_work_us"),
        authorized_without_sponsorship=data.get("authorized_without_sponsorship"),
        referral_source=data.get("referral_source"),
        at_least_18=data.get("at_least_18"),
        needs_visa_sponsorship=data.get("needs_visa_sponsorship"),
        family_in_org=data.get("family_in_org"),
        availability=data.get("availability"),
        education=data.get("education"),
        certificates=data.get("certificates"),
    )

    if data.get("birthdate"):
        from datetime import date
        y, m, d = map(int, data["birthdate"].split("-"))
        c.birthdate = date(y, m, d)

    db.session.add(c)
    db.session.commit()
    return {"message": "Candidate created", "id": c.id}, 201

@bp.put("/<int:cand_id>")
@jwt_required()
def update_candidate(cand_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    data = request.get_json() or {}
    
    # Validate email if being updated
    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        if not email or "@" not in email:
            return {"message": "Valid email is required"}, 400
        
        existing_email = Candidate.query.filter(
            Candidate.email == email,
            Candidate.created_by_user_id == uid,
            Candidate.id != cand_id
        ).first()
        if existing_email:
            return {"message": "A candidate with this email already exists"}, 409
    
    # Validate phone if being updated
    if "phone" in data:
        phone = (data.get("phone") or "").strip()
        if not phone.isdigit():
            return {"message": "Phone number must contain only digits"}, 400
        
        existing_phone = Candidate.query.filter(
            Candidate.phone == phone,
            Candidate.created_by_user_id == uid,
            Candidate.id != cand_id
        ).first()
        if existing_phone:
            return {"message": "A candidate with this phone number already exists"}, 409

    for field in [
        "first_name", "last_name", "email", "phone", "gender", "nationality",
        "citizenship_status", "visa_status", "work_authorization",
        "veteran_status", "race_ethnicity", "address_line1", "address_line2",
        "city", "state", "postal_code", "country", "personal_website",
        "linkedin", "github", "technical_skills", "work_experience",
        # NEW
        "expected_wage", "contact_current_employer", "recent_degree",
        "authorized_work_us", "authorized_without_sponsorship",
        "referral_source", "at_least_18", "needs_visa_sponsorship",
        "family_in_org", "availability", "education", "certificates",
    ]:
        if field in data:
            setattr(c, field, data[field])

    for field in ["willing_relocate", "willing_travel", "disability_status", "military_experience"]:
        if field in data:
            setattr(c, field, to_bool(data[field]))

    if "birthdate" in data:
        from datetime import date
        if data["birthdate"]:
            y, m, d = map(int, data["birthdate"].split("-"))
            c.birthdate = date(y, m, d)
        else:
            c.birthdate = None

    db.session.commit()
    return {"message": "Candidate updated"}

@bp.delete("/<int:cand_id>")
@jwt_required()
def delete_candidate(cand_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    db.session.delete(c)
    db.session.commit()
    return {"message": "Candidate deleted"}

# --------- DETAIL + JOBS SUBRESOURCE (the missing bits) ---------

@bp.get("/<int:cand_id>")
@jwt_required()
def get_candidate(cand_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    # include_jobs=True so the page shows rows without a second fetch if you want
    return c.to_dict(include_creator=False, include_jobs=True)

@bp.get("/<int:cand_id>/jobs")
@jwt_required()
def list_jobs(cand_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    return {
        "jobs": [
            {
                "id": j.id,
                "job_id": j.job_id,
                "job_description": j.job_description,
                "resume_content": j.resume_content,
                "created_at": j.created_at.isoformat(),
            }
            for j in sorted(c.jobs, key=lambda x: x.id, reverse=True)
        ]
    }

@bp.post("/<int:cand_id>/jobs")
@jwt_required()
def add_job(cand_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    data = request.get_json() or {}
    job_id = (data.get("job_id") or "").strip()
    job_desc = (data.get("job_description") or "").strip()
    if not job_id or not job_desc:
        return {"message": "job_id and job_description are required"}, 400

    row = CandidateJob(candidate_id=c.id, job_id=job_id, job_description=job_desc)
    db.session.add(row)
    db.session.commit()
    return {"message": "added", "id": row.id}, 201

@bp.put("/<int:cand_id>/jobs/<int:row_id>")
@jwt_required()
def update_job(cand_id, row_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)
    
    row = CandidateJob.query.filter_by(id=row_id, candidate_id=c.id).first_or_404()
    data = request.get_json() or {}
    
    if "job_id" in data:
        job_id = (data.get("job_id") or "").strip()
        if job_id:
            row.job_id = job_id
    
    if "job_description" in data:
        job_desc = (data.get("job_description") or "").strip()
        if job_desc:
            row.job_description = job_desc
    
    db.session.commit()
    return {"message": "updated"}

@bp.delete("/<int:cand_id>/jobs/<int:row_id>")
@jwt_required()
def delete_job(cand_id, row_id):
    uid = current_user_id()
    c = Candidate.query.get_or_404(cand_id)
    owns_or_404(c, uid)

    row = CandidateJob.query.filter_by(id=row_id, candidate_id=c.id).first_or_404()
    db.session.delete(row)
    db.session.commit()
    return {"message": "deleted"}
