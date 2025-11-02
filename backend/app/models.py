from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy import inspect

db = SQLAlchemy()

# Association table for many-to-many relationship between Candidate and assigned Users
# Define it but SQLAlchemy will handle it gracefully if it doesn't exist yet
candidate_assigned_users = db.Table('candidate_assigned_users',
    db.Column('candidate_id', db.Integer, db.ForeignKey('candidate.id', ondelete='CASCADE'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True),
    db.Column('assigned_at', db.DateTime, default=datetime.utcnow)
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, index=True, nullable=False)
    mobile = db.Column(db.String(30), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user")  # "admin" | "user"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidates = db.relationship("Candidate", backref="creator", lazy=True)
    
    # Many-to-many relationship: Users assigned to candidates
    assigned_candidates = db.relationship(
        "Candidate",
        secondary=candidate_assigned_users,
        backref=db.backref("assigned_users", lazy="selectin"),
        lazy="dynamic"
    )

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "email": self.email,
            "mobile": self.mobile, "role": self.role,
            "created_at": self.created_at.isoformat()
        }


class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ownership
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    # Personal Information
    first_name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    subscription_type = db.Column(db.String(50))  # Gold or Silver
    subscription_start_date = db.Column(db.Date)  # Subscription start date
    password = db.Column(db.String(255))  # Candidate password (minimum 6 characters)
    role = db.Column(db.String(255))  # Role/Position
    ssn = db.Column(db.String(10), unique=True, index=True)  # Social Security Number (unique)
    birthdate = db.Column(db.Date)
    gender = db.Column(db.String(50))
    nationality = db.Column(db.String(120))
    citizenship_status = db.Column(db.String(120))
    visa_status = db.Column(db.String(120))
    f1_type = db.Column(db.String(120))  # F1 Type (Post OPT or STEM OPT)
    work_authorization = db.Column(db.String(120))
    willing_relocate = db.Column(db.Boolean, default=False)
    willing_travel = db.Column(db.Boolean, default=False)
    disability_status = db.Column(db.Boolean, default=False)
    veteran_status = db.Column(db.String(120))
    military_experience = db.Column(db.Boolean, default=False)
    race_ethnicity = db.Column(db.String(120))

    # New extra questions
    expected_wage = db.Column(db.String(120))                # expected salary / hourly wage
    contact_current_employer = db.Column(db.String(120))     # may we contact current employer?
    recent_degree = db.Column(db.String(255))                # most recent degree / qualification
    authorized_work_us = db.Column(db.String(120))           # legally authorized to work in US
    authorized_without_sponsorship = db.Column(db.String(120))  # authorized to work without sponsorship
    referral_source = db.Column(db.String(255))              # how did you learn about this opportunity
    at_least_18 = db.Column(db.String(10))                   # are you at least 18?
    needs_visa_sponsorship = db.Column(db.String(120))       # require sponsorship now/future
    family_in_org = db.Column(db.String(255))                # family member employed with org
    availability = db.Column(db.String(120))                 # availability to start

    # Address
    address_line1 = db.Column(db.String(255))
    address_line2 = db.Column(db.String(255))
    city = db.Column(db.String(120))
    state = db.Column(db.String(120))
    postal_code = db.Column(db.String(40))
    country = db.Column(db.String(120))

    # Online presence
    personal_website = db.Column(db.String(255))
    linkedin = db.Column(db.String(255))
    github = db.Column(db.String(255))

    # Additional
    technical_skills = db.Column(db.Text)
    work_experience = db.Column(db.Text)
    education = db.Column(db.Text)
    certificates = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # --- NEW: relation to CandidateJob rows (job id + description + timestamp) ---
    jobs = relationship(
        "CandidateJob",
        backref="candidate",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self, include_creator: bool = False, include_jobs: bool = False):
        # Helper to convert boolean to Yes/No for frontend
        def to_yes_no(val):
            if val is None:
                return None
            return "Yes" if val else "No"
        
        d = {
            "id": self.id,
            "first_name": self.first_name, "last_name": self.last_name,
            "email": self.email, "phone": self.phone,
            "subscription_type": self.subscription_type,
            "subscription_start_date": self.subscription_start_date.isoformat() if self.subscription_start_date else None,
            "role": self.role,
            "ssn": self.ssn,
            "birthdate": self.birthdate.isoformat() if self.birthdate else None,
            "gender": self.gender, "nationality": self.nationality,
            "citizenship_status": self.citizenship_status,
            "visa_status": self.visa_status,
            "f1_type": self.f1_type,
            "work_authorization": self.work_authorization,
            "willing_relocate": to_yes_no(self.willing_relocate),
            "willing_travel": to_yes_no(self.willing_travel),
            "disability_status": to_yes_no(self.disability_status),
            "veteran_status": self.veteran_status,
            "military_experience": to_yes_no(self.military_experience),
            "race_ethnicity": self.race_ethnicity,

            "address_line1": self.address_line1, "address_line2": self.address_line2,
            "city": self.city, "state": self.state, "postal_code": self.postal_code,
            "country": self.country,

            "personal_website": self.personal_website, "linkedin": self.linkedin, "github": self.github,

            "technical_skills": self.technical_skills, "work_experience": self.work_experience,
            "education": self.education, "certificates": self.certificates,

            "expected_wage": self.expected_wage,
            "contact_current_employer": self.contact_current_employer,
            "recent_degree": self.recent_degree,
            "authorized_work_us": self.authorized_work_us,
            "authorized_without_sponsorship": self.authorized_without_sponsorship,
            "referral_source": self.referral_source,
            "at_least_18": self.at_least_18,
            "needs_visa_sponsorship": self.needs_visa_sponsorship,
            "family_in_org": self.family_in_org,
            "availability": self.availability,

            "created_at": self.created_at.isoformat(),
        }

        if include_creator:
            # Handle case where creator might be None (deleted user, migration issue, etc.)
            if self.creator:
                d["created_by"] = {
                    "id": self.creator.id,
                    "email": self.creator.email,
                    "name": self.creator.name,
                }
            else:
                d["created_by"] = None
            # Include assigned users (backward compatible - handle if table doesn't exist)
            try:
                # Check if the association table exists before querying
                inspector_obj = inspect(db.engine)
                if 'candidate_assigned_users' in inspector_obj.get_table_names():
                    d["assigned_users"] = [
                        {
                            "id": u.id,
                            "email": u.email,
                            "name": u.name,
                        }
                        for u in (self.assigned_users or [])
                    ]
                else:
                    d["assigned_users"] = []
            except Exception as e:
                # Table doesn't exist yet (migration not run) or other error
                d["assigned_users"] = []

        if include_jobs:
            d["jobs"] = [
                {
                    "id": j.id,
                    "job_id": j.job_id,
                    "job_description": j.job_description,
                    "resume_content": j.resume_content,
                    "created_at": j.created_at.isoformat(),
                }
                for j in sorted(self.jobs, key=lambda x: x.id, reverse=True)
            ]

        return d


# --- NEW: table for per-candidate job notes/rows ---
class CandidateJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("candidate.id"), nullable=False, index=True)
    job_id = db.Column(db.Text, nullable=False)
    job_description = db.Column(db.Text, nullable=False)

    # NEW: what we generate + where we saved the .docx
    resume_content = db.Column(db.Text)
    docx_path = db.Column(db.String(512))

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


# --- NEW: Async Job Tracking for Resume Generation ---
class ResumeGenerationJob(db.Model):
    """Track async resume generation jobs"""
    __tablename__ = 'resume_generation_job'
    
    id = db.Column(db.String(255), primary_key=True)  # Celery task ID
    candidate_id = db.Column(db.Integer, db.ForeignKey("candidate.id"), nullable=False, index=True)
    job_row_id = db.Column(db.Integer, db.ForeignKey("candidate_job.id"), nullable=True, index=True)
    
    # Job details
    status = db.Column(db.String(50), default='PENDING', index=True)  # PENDING, PROCESSING, SUCCESS, FAILURE
    progress = db.Column(db.Integer, default=0)  # 0-100
    
    # Input parameters
    file_type = db.Column(db.String(20), default='word')  # word or pdf
    
    # Results
    result_url = db.Column(db.String(512))  # URL to download the resume (if stored)
    error_message = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    candidate = relationship("Candidate", backref="resume_jobs", lazy=True)
    candidate_job = relationship("CandidateJob", backref="generation_jobs", lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "job_row_id": self.job_row_id,
            "status": self.status,
            "progress": self.progress,
            "file_type": self.file_type,
            "result_url": self.result_url,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


# --- NEW: Subscription Management for Candidates ---
class Subscription(db.Model):
    """Monthly subscription management for candidates"""
    __tablename__ = 'subscription'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidate.id'), unique=True, nullable=False, index=True)
    
    # Subscription details
    tier = db.Column(db.String(50), nullable=False)  # 'Gold' or 'Silver'
    status = db.Column(db.String(50), nullable=False, default='inactive', index=True)  # 'active', 'inactive', 'paused', 'expired'
    
    # Billing cycle
    billing_cycle = db.Column(db.String(20), default='monthly')  # 'monthly', 'yearly'
    price = db.Column(db.Numeric(10, 2))  # Price in USD
    
    # Dates
    activated_at = db.Column(db.DateTime)  # When subscription started
    expires_at = db.Column(db.DateTime, index=True)  # When subscription expires
    renewal_date = db.Column(db.DateTime)  # When subscription is due for renewal
    paused_at = db.Column(db.DateTime)  # When subscription was paused
    deactivated_at = db.Column(db.DateTime)  # When subscription ended
    
    # Metadata
    notes = db.Column(db.Text)  # Admin notes
    payment_method = db.Column(db.String(100), default='manual')  # 'manual', 'stripe', 'paypal', 'razorpay', etc.
    transaction_id = db.Column(db.String(255))  # Payment reference
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    candidate = relationship("Candidate", backref=db.backref("subscription", cascade="all, delete-orphan"), lazy=True)
    
    def to_dict(self, include_candidate: bool = False):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "tier": self.tier,
            "status": self.status,
            "billing_cycle": self.billing_cycle,
            "price": float(self.price) if self.price else None,
            "activated_at": self.activated_at.isoformat() if self.activated_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "renewal_date": self.renewal_date.isoformat() if self.renewal_date else None,
            "paused_at": self.paused_at.isoformat() if self.paused_at else None,
            "deactivated_at": self.deactivated_at.isoformat() if self.deactivated_at else None,
            "notes": self.notes,
            "payment_method": self.payment_method,
            "transaction_id": self.transaction_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# --- Monthly Transactions for Candidates ---
class Transaction(db.Model):
    """Monthly transaction records for candidates"""
    __tablename__ = 'transaction'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidate.id'), nullable=False, index=True)
    
    # Transaction details
    transaction_id = db.Column(db.String(255), unique=True, nullable=False, index=True)  # Auto-generated unique ID
    original_transaction = db.Column(db.String(255))  # Optional original transaction reference
    
    # Dates
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    candidate = relationship("Candidate", backref=db.backref("transactions", cascade="all, delete-orphan"), lazy=True)
    
    def to_dict(self, include_candidate: bool = False):
        d = {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "transaction_id": self.transaction_id,
            "original_transaction": self.original_transaction,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_candidate and self.candidate:
            d["candidate"] = {
                "id": self.candidate.id,
                "first_name": self.candidate.first_name,
                "last_name": self.candidate.last_name,
                "email": self.candidate.email,
            }
        
        return d