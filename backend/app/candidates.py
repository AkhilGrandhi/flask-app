# server/candidates.py
from flask import Blueprint, request, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from .models import db, Candidate, CandidateJob

bp = Blueprint("candidates", __name__)

def current_user_id():
    return int(get_jwt_identity())

def current_candidate_id():
    """Extract candidate ID from JWT for candidate logins"""
    claims = get_jwt()
    if claims.get("role") == "candidate":
        return claims.get("candidate_id")
    return None

def is_admin():
    """Check if current user is admin"""
    claims = get_jwt()
    return claims.get("role") == "admin"

def owns_or_404(cand: Candidate, uid: int):
    # Admins can access any candidate
    if is_admin():
        return
    # Check if user is creator OR assigned to this candidate
    if not cand:
        abort(404)
    is_creator = cand.created_by_user_id == uid
    # Check if user is assigned (backward compatible)
    try:
        is_assigned = any(u.id == uid for u in (cand.assigned_users or []))
    except Exception:
        # Table doesn't exist yet (migration not run)
        is_assigned = False
    if not (is_creator or is_assigned):
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
    from .models import User
    user = User.query.get(uid)
    if not user:
        abort(404, description="User not found")
    
    # Get candidates created by user
    created_candidates = Candidate.query.filter_by(created_by_user_id=uid).all()
    
    # Get candidates assigned to user (backward compatible)
    try:
        assigned_candidates = user.assigned_candidates.all()
    except Exception:
        # Table doesn't exist yet (migration not run)
        assigned_candidates = []
    
    # Combine and remove duplicates (in case user is both creator and assigned)
    all_candidates = {c.id: c for c in created_candidates + assigned_candidates}
    
    # Sort by ID descending
    sorted_candidates = sorted(all_candidates.values(), key=lambda x: x.id, reverse=True)
    
    return {"candidates": [c.to_dict(include_jobs=True) for c in sorted_candidates]}

@bp.post("")
@jwt_required()
def create_candidate():
    try:
        uid = current_user_id()
        data = request.get_json() or {}
        
        # Allow admin to assign a different user as creator
        creator_user_id = uid  # Default to current user
        if is_admin() and data.get("created_by_user_id"):
            creator_user_id = data.get("created_by_user_id")
            # Validate that the assigned user exists
            from .models import User
            assigned_user = User.query.get(creator_user_id)
            if not assigned_user:
                return {"message": "Assigned user not found"}, 404
        
        # Validate required fields
        required = ["first_name", "last_name", "email", "phone", "subscription_type", "password", "role", "ssn", "birthdate", "gender", 
                    "nationality", "citizenship_status", "visa_status", "work_authorization",
                    "address_line1", "city", "state", "postal_code", "country",
                    "work_experience", "education"]
        missing_fields = [f for f in required if not data.get(f)]
        if missing_fields:
            return {"message": f"Required fields missing: {', '.join(missing_fields)}"}, 400
        
        # Validate password length
        password = data.get("password", "")
        if len(password) < 6:
            return {"message": "Password must be at least 6 characters"}, 400
        
        # Validate email format and uniqueness
        email = (data.get("email") or "").strip().lower()
        if not email or "@" not in email:
            return {"message": "Valid email is required"}, 400
        
        # For admin, check globally; for regular users, check within their candidates only
        if is_admin():
            existing_email = Candidate.query.filter(Candidate.email == email).first()
        else:
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
        
        # For admin, check globally; for regular users, check within their candidates only
        if is_admin():
            existing_phone = Candidate.query.filter(Candidate.phone == phone).first()
        else:
            existing_phone = Candidate.query.filter(
                Candidate.phone == phone,
                Candidate.created_by_user_id == uid
            ).first()
        if existing_phone:
            return {"message": "A candidate with this phone number already exists"}, 409
        
        # Validate SSN uniqueness (globally unique)
        ssn = (data.get("ssn") or "").strip()
        if not ssn:
            return {"message": "SSN is required"}, 400
        
        if len(ssn) < 4 or len(ssn) > 10:
            return {"message": "SSN must be between 4 and 10 characters"}, 400
        
        existing_ssn = Candidate.query.filter(Candidate.ssn == ssn).first()
        if existing_ssn:
            return {"message": "A candidate with this SSN already exists"}, 409

        c = Candidate(
            created_by_user_id=creator_user_id,
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            email=data.get("email"),
            phone=data.get("phone"),
            subscription_type=data.get("subscription_type"),
            password=data.get("password"),
            role=data.get("role"),
            ssn=data.get("ssn"),
            gender=data.get("gender"),
            nationality=data.get("nationality"),
            citizenship_status=data.get("citizenship_status"),
            visa_status=data.get("visa_status"),
            f1_type=data.get("f1_type"),
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

        # Handle birthdate - with error handling
        if data.get("birthdate"):
            try:
                from datetime import date
                birthdate_str = str(data["birthdate"]).strip()
                y, m, d = None, None, None  # Initialize variables
                # Handle different date formats
                if "-" in birthdate_str:
                    y, m, d = map(int, birthdate_str.split("-"))
                elif "/" in birthdate_str:
                    # Convert MM/DD/YYYY to YYYY-MM-DD
                    parts = birthdate_str.split("/")
                    if len(parts) == 3:
                        m, d, y = map(int, parts)
                    else:
                        return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                else:
                    return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                
                if y is None or m is None or d is None:
                    return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                    
                c.birthdate = date(y, m, d)
            except (ValueError, AttributeError) as e:
                return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400

        db.session.add(c)
        db.session.flush()  # Flush to get the candidate ID
        
        # Handle assigned users (admin only) - with defensive check
        if is_admin() and "assigned_user_ids" in data:
            try:
                from sqlalchemy import inspect as sql_inspect
                inspector = sql_inspect(db.engine)
                if 'candidate_assigned_users' in inspector.get_table_names():
                    assigned_user_ids = data.get("assigned_user_ids", [])
                    import logging
                    logging.info(f"Creating candidate with assigned_user_ids: {assigned_user_ids}")
                    if assigned_user_ids:
                        from .models import User
                        for user_id in assigned_user_ids:
                            user = User.query.get(user_id)
                            if user and user.role == "user":  # Only assign to regular users
                                c.assigned_users.append(user)
                                logging.info(f"Assigned user {user.id} ({user.name}) to candidate")
                            else:
                                logging.warning(f"User {user_id} not found or not a regular user")
                else:
                    import logging
                    logging.warning("candidate_assigned_users table does not exist")
            except Exception as e:
                # Log error but don't fail the creation
                import logging
                import traceback
                logging.error(f"Could not assign users during creation: {e}")
                logging.error(traceback.format_exc())
        
        db.session.commit()
        return {"message": "Candidate created", "id": c.id}, 201
    except Exception as e:
        db.session.rollback()
        import logging
        logging.error(f"Error creating candidate: {e}")
        return {"message": f"Failed to create candidate: {str(e)}"}, 500

@bp.put("/<int:cand_id>")
@jwt_required()
def update_candidate(cand_id):
    try:
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
        
        # Validate SSN if being updated (globally unique)
        if "ssn" in data:
            ssn = (data.get("ssn") or "").strip()
            if not ssn:
                return {"message": "SSN is required"}, 400
            
            if len(ssn) < 4 or len(ssn) > 10:
                return {"message": "SSN must be between 4 and 10 characters"}, 400
            
            existing_ssn = Candidate.query.filter(
                Candidate.ssn == ssn,
                Candidate.id != cand_id
            ).first()
            if existing_ssn:
                return {"message": "A candidate with this SSN already exists"}, 409
        
        # Validate password if being updated
        if "password" in data and data.get("password"):
            password = data.get("password")
            if len(password) < 6:
                return {"message": "Password must be at least 6 characters"}, 400

        for field in [
            "first_name", "last_name", "email", "phone", "subscription_type", "role", "ssn", "gender", "nationality",
            "citizenship_status", "visa_status", "f1_type", "work_authorization",
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
        
        # Handle password separately - only update if provided and not empty
        if "password" in data and data.get("password") and data.get("password").strip():
            c.password = data.get("password")

        for field in ["willing_relocate", "willing_travel", "disability_status", "military_experience"]:
            if field in data:
                setattr(c, field, to_bool(data[field]))

        # birthdate - with error handling
        if "birthdate" in data:
            try:
                from datetime import date
                if data["birthdate"]:
                    birthdate_str = str(data["birthdate"]).strip()
                    y, m, d = None, None, None  # Initialize variables
                    # Handle different date formats
                    if "-" in birthdate_str:
                        y, m, d = map(int, birthdate_str.split("-"))
                    elif "/" in birthdate_str:
                        # Convert MM/DD/YYYY to YYYY-MM-DD
                        parts = birthdate_str.split("/")
                        if len(parts) == 3:
                            m, d, y = map(int, parts)
                        else:
                            return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                    else:
                        return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                    
                    if y is None or m is None or d is None:
                        return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                        
                    c.birthdate = date(y, m, d)
                else:
                    c.birthdate = None
            except (ValueError, AttributeError) as e:
                return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
        
        # Handle assigned users (admin only) - with defensive check
        if is_admin() and "assigned_user_ids" in data:
            try:
                from sqlalchemy import inspect as sql_inspect
                inspector = sql_inspect(db.engine)
                if 'candidate_assigned_users' in inspector.get_table_names():
                    assigned_user_ids = data.get("assigned_user_ids", [])
                    import logging
                    logging.info(f"Updating candidate {cand_id} with assigned_user_ids: {assigned_user_ids}")
                    # Clear existing assignments
                    c.assigned_users = []
                    # Add new assignments
                    if assigned_user_ids:
                        from .models import User
                        for user_id in assigned_user_ids:
                            user = User.query.get(user_id)
                            if user and user.role == "user":  # Only assign to regular users
                                c.assigned_users.append(user)
                                logging.info(f"Assigned user {user.id} ({user.name}) to candidate {cand_id}")
                            else:
                                logging.warning(f"User {user_id} not found or not a regular user")
                else:
                    import logging
                    logging.warning("candidate_assigned_users table does not exist")
            except Exception as e:
                # Log error but don't fail the update
                import logging
                import traceback
                logging.error(f"Could not update assigned users: {e}")
                logging.error(traceback.format_exc())

        db.session.commit()
        return {"message": "Candidate updated"}
    except Exception as e:
        db.session.rollback()
        import logging
        logging.error(f"Error updating candidate {cand_id}: {e}")
        return {"message": f"Failed to update candidate: {str(e)}"}, 500

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
    # Handle both candidate and user/admin logins
    claims = get_jwt()
    role = claims.get("role")
    
    c = Candidate.query.get_or_404(cand_id)
    
    if role == "candidate":
        # Candidate can only add jobs to their own profile
        candidate_id = claims.get("candidate_id")
        if candidate_id != cand_id:
            abort(403)  # Forbidden
    else:
        # User/Admin - check ownership
        uid = current_user_id()
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
    # Handle both candidate and user/admin logins
    claims = get_jwt()
    role = claims.get("role")
    
    c = Candidate.query.get_or_404(cand_id)
    
    if role == "candidate":
        # Candidate can only update their own jobs
        candidate_id = claims.get("candidate_id")
        if candidate_id != cand_id:
            abort(403)
    else:
        # User/Admin - check ownership
        uid = current_user_id()
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
    # Handle both candidate and user/admin logins
    claims = get_jwt()
    role = claims.get("role")
    
    c = Candidate.query.get_or_404(cand_id)
    
    if role == "candidate":
        # Candidate can only delete their own jobs
        candidate_id = claims.get("candidate_id")
        if candidate_id != cand_id:
            abort(403)
    else:
        # User/Admin - check ownership
        uid = current_user_id()
        owns_or_404(c, uid)

    row = CandidateJob.query.filter_by(id=row_id, candidate_id=c.id).first_or_404()
    db.session.delete(row)
    db.session.commit()
    return {"message": "deleted"}

# --------- CANDIDATE SELF-SERVICE (for candidate login) ---------

@bp.get("/me")
@jwt_required()
def get_my_profile():
    """Get logged-in candidate's own profile and jobs"""
    cand_id = current_candidate_id()
    if not cand_id:
        abort(403, description="Candidates only")
    
    c = Candidate.query.get_or_404(cand_id)
    return c.to_dict(include_creator=False, include_jobs=True)

@bp.put("/me")
@jwt_required()
def update_my_profile():
    """Update logged-in candidate's own profile"""
    cand_id = current_candidate_id()
    if not cand_id:
        abort(403, description="Candidates only")
    
    candidate = Candidate.query.get_or_404(cand_id)
    data = request.get_json() or {}
    
    # Candidates cannot update their email, phone, or password through this endpoint
    # Those should have separate secure endpoints
    restricted_fields = ["email", "phone", "password", "created_by_user_id"]
    for field in restricted_fields:
        if field in data:
            del data[field]
    
    # Update allowed fields
    for field in [
        "first_name", "last_name", "gender", "nationality",
        "citizenship_status", "visa_status", "f1_type", "work_authorization",
        "veteran_status", "race_ethnicity", "address_line1", "address_line2",
        "city", "state", "postal_code", "country", "personal_website",
        "linkedin", "github", "technical_skills", "work_experience",
        "expected_wage", "contact_current_employer", "recent_degree",
        "authorized_work_us", "authorized_without_sponsorship",
        "referral_source", "at_least_18", "needs_visa_sponsorship",
        "family_in_org", "ssn", "availability", "education", "certificates",
    ]:
        if field in data:
            setattr(candidate, field, data[field])
    
    # Boolean fields
    for field in ["willing_relocate", "willing_travel", "disability_status", "military_experience"]:
        if field in data:
            setattr(candidate, field, to_bool(data[field]))
    
    # Handle birthdate - with error handling
    if "birthdate" in data:
        try:
            from datetime import date
            if data["birthdate"]:
                birthdate_str = str(data["birthdate"]).strip()
                y, m, d = None, None, None  # Initialize variables
                # Handle different date formats
                if "-" in birthdate_str:
                    y, m, d = map(int, birthdate_str.split("-"))
                elif "/" in birthdate_str:
                    # Convert MM/DD/YYYY to YYYY-MM-DD
                    parts = birthdate_str.split("/")
                    if len(parts) == 3:
                        m, d, y = map(int, parts)
                    else:
                        return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                else:
                    return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                
                if y is None or m is None or d is None:
                    return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
                    
                candidate.birthdate = date(y, m, d)
            else:
                candidate.birthdate = None
        except (ValueError, AttributeError) as e:
            return {"message": "Invalid birthdate format. Use YYYY-MM-DD or MM/DD/YYYY"}, 400
    
    db.session.commit()
    return {"message": "Profile updated successfully", "candidate": candidate.to_dict(include_creator=False, include_jobs=True)}
