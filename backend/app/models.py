from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

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
    birthdate = db.Column(db.Date)
    gender = db.Column(db.String(50))
    nationality = db.Column(db.String(120))
    citizenship_status = db.Column(db.String(120))
    visa_status = db.Column(db.String(120))
    work_authorization = db.Column(db.String(120))
    willing_relocate = db.Column(db.Boolean, default=False)
    willing_travel = db.Column(db.Boolean, default=False)
    disability_status = db.Column(db.Boolean, default=False)
    veteran_status = db.Column(db.String(120))
    military_experience = db.Column(db.Boolean, default=False)
    race_ethnicity = db.Column(db.String(120))

    #New
    expected_wage = db.Column(db.String(120))                # "What is your expected salary or hourly wage?"
    contact_current_employer = db.Column(db.String(120))     # "May we contact your current employer for a reference?"
    recent_degree = db.Column(db.String(255))                # "Please list your most recent degree or educational qualification."
    authorized_work_us = db.Column(db.String(120))           # "Are you legally authorized to work in the United States?"
    authorized_without_sponsorship = db.Column(db.String(120))  # "Do you currently have authorization to work in the U.S. without the need for sponsorship?"
    referral_source = db.Column(db.String(255))              # "How did you learn about this opportunity?"
    at_least_18 = db.Column(db.String(10))                   # "Are you at least 18 years of age?"
    needs_visa_sponsorship = db.Column(db.String(120))       # "Will you require sponsorship for employment visa status now or in the future (e.g., H-1B visa)?"
    family_in_org = db.Column(db.String(255))                # "Do you have any family members currently employed with our organization (by blood or marriage)?"
    availability = db.Column(db.String(120))  

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
    education = db.Column(db.Text)                           # "Education"
    certificates = db.Column(db.Text) 

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_creator=False):
        d = {
            "id": self.id,
            "first_name": self.first_name, "last_name": self.last_name,
            "email": self.email, "phone": self.phone,
            "birthdate": self.birthdate.isoformat() if self.birthdate else None,
            "gender": self.gender, "nationality": self.nationality,
            "citizenship_status": self.citizenship_status,
            "visa_status": self.visa_status,
            "work_authorization": self.work_authorization,
            "willing_relocate": self.willing_relocate,
            "willing_travel": self.willing_travel,
            "disability_status": self.disability_status,
            "veteran_status": self.veteran_status,
            "military_experience": self.military_experience,
            "race_ethnicity": self.race_ethnicity,
            "address_line1": self.address_line1, "address_line2": self.address_line2,
            "city": self.city, "state": self.state, "postal_code": self.postal_code,
            "country": self.country,
            "personal_website": self.personal_website, "linkedin": self.linkedin, "github": self.github,
            "technical_skills": self.technical_skills, "work_experience": self.work_experience,
            
            # NEW
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
            "education": self.education,
            "certificates": self.certificates,

            "created_at": self.created_at.isoformat()
        }
        if include_creator:
            d["created_by"] = {
                "id": self.creator.id,
                "email": self.creator.email,
                "name": self.creator.name
            }
        return d
