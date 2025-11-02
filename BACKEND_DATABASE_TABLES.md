# Backend Database Tables Documentation

## Overview

The Flask backend uses PostgreSQL as the database with SQLAlchemy ORM. This document provides a comprehensive overview of all database tables, their schemas, relationships, and usage patterns.

---

## Database Schema Summary

The database consists of **4 main tables**:

1. **`user`** - Admin and regular user accounts
2. **`candidate`** - Candidate/Applicant information
3. **`candidate_job`** - Job applications per candidate
4. **`resume_generation_job`** - Async resume generation tracking

**1 association table**:

5. **`candidate_assigned_users`** - Many-to-many relationship between candidates and assigned users

---

## Table: `user`

**Purpose:** Stores admin and regular user accounts for system access.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-incrementing user ID |
| `name` | VARCHAR(120) | NOT NULL | Full name of the user |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | User email address |
| `mobile` | VARCHAR(30) | UNIQUE, NOT NULL, INDEX | User mobile number |
| `password_hash` | VARCHAR(255) | NOT NULL | Hashed password (Werkzeug) |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT='user' | User role: "admin" or "user" |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT=now() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT=now() | Last update timestamp |

### Relationships

- **One-to-Many:** `user.candidates` → `candidate` (users create candidates)
- **Many-to-Many:** `user.assigned_candidates` ↔ `candidate` (users assigned to candidates)

### Indexes

- `uq_user_email` (UNIQUE on `email`)
- `uq_user_mobile` (UNIQUE on `mobile`)
- `ix_user_email` (INDEX on `email`)
- `ix_user_mobile` (INDEX on `mobile`)

### Usage

```python
# Example: Create a new user
user = User(
    name="John Doe",
    email="john@example.com",
    mobile="+1234567890",
    password_hash=generate_password_hash("password"),
    role="user"
)

# Example: Login as admin (email + password)
# Example: Login as user (mobile + password)
```

### Notes

- Admin users have full access to all features
- Regular users have limited access
- Passwords are hashed using Werkzeug's `generate_password_hash`
- Mobile number is used for user login authentication

---

## Table: `candidate`

**Purpose:** Comprehensive candidate/applicant information including personal details, work authorization, address, skills, and experience.

### Schema

#### Ownership & Identity

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-incrementing candidate ID |
| `created_by_user_id` | INTEGER | NOT NULL, FK → user.id | User who created this candidate |

#### Personal Information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `first_name` | VARCHAR(120) | NOT NULL | First name |
| `last_name` | VARCHAR(120) | NOT NULL | Last name |
| `email` | VARCHAR(255) | NULLABLE | Email address |
| `phone` | VARCHAR(50) | NULLABLE | Phone number |
| `password` | VARCHAR(255) | NULLABLE | Candidate password (min 6 chars) |
| `role` | VARCHAR(255) | NULLABLE | Desired position/role |
| `subscription_type` | VARCHAR(50) | NULLABLE | "Gold" or "Silver" |
| `ssn` | VARCHAR(10) | UNIQUE, INDEX | Social Security Number |
| `birthdate` | DATE | NULLABLE | Date of birth |
| `gender` | VARCHAR(50) | NULLABLE | Gender |
| `nationality` | VARCHAR(120) | NULLABLE | Nationality |
| `citizenship_status` | VARCHAR(120) | NULLABLE | Citizenship status |
| `visa_status` | VARCHAR(120) | NULLABLE | Visa status |
| `f1_type` | VARCHAR(120) | NULLABLE | F1 Type (Post OPT or STEM OPT) |
| `work_authorization` | VARCHAR(120) | NULLABLE | Work authorization status |
| `willing_relocate` | BOOLEAN | NOT NULL, DEFAULT=false | Willing to relocate |
| `willing_travel` | BOOLEAN | NOT NULL, DEFAULT=false | Willing to travel |
| `disability_status` | BOOLEAN | NOT NULL, DEFAULT=false | Disability status |
| `veteran_status` | VARCHAR(120) | NULLABLE | Veteran status |
| `military_experience` | BOOLEAN | NOT NULL, DEFAULT=false | Military experience |
| `race_ethnicity` | VARCHAR(120) | NULLABLE | Race/ethnicity |

#### Additional Application Questions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `expected_wage` | VARCHAR(120) | NULLABLE | Expected salary/hourly wage |
| `contact_current_employer` | VARCHAR(120) | NULLABLE | May we contact current employer? |
| `recent_degree` | VARCHAR(255) | NULLABLE | Most recent degree/qualification |
| `authorized_work_us` | VARCHAR(120) | NULLABLE | Legally authorized to work in US |
| `authorized_without_sponsorship` | VARCHAR(120) | NULLABLE | Authorized without sponsorship |
| `referral_source` | VARCHAR(255) | NULLABLE | How did you learn about this opportunity |
| `at_least_18` | VARCHAR(10) | NULLABLE | Are you at least 18 years old? |
| `needs_visa_sponsorship` | VARCHAR(120) | NULLABLE | Require sponsorship now or future |
| `family_in_org` | VARCHAR(255) | NULLABLE | Family member employed with organization |
| `availability` | VARCHAR(120) | NULLABLE | Availability to start |

#### Address Information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `address_line1` | VARCHAR(255) | NULLABLE | Street address line 1 |
| `address_line2` | VARCHAR(255) | NULLABLE | Street address line 2 |
| `city` | VARCHAR(120) | NULLABLE | City |
| `state` | VARCHAR(120) | NULLABLE | State/Province |
| `postal_code` | VARCHAR(40) | NULLABLE | ZIP/Postal code |
| `country` | VARCHAR(120) | NULLABLE | Country |

#### Online Presence

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `personal_website` | VARCHAR(255) | NULLABLE | Personal website URL |
| `linkedin` | VARCHAR(255) | NULLABLE | LinkedIn profile URL |
| `github` | VARCHAR(255) | NULLABLE | GitHub profile URL |

#### Professional Information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `technical_skills` | TEXT | NULLABLE | Technical skills (JSON/text) |
| `work_experience` | TEXT | NULLABLE | Work experience (JSON/text) |
| `education` | TEXT | NULLABLE | Education history (JSON/text) |
| `certificates` | TEXT | NULLABLE | Certifications (JSON/text) |

#### Timestamps

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT=now() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT=now() | Last update timestamp |

### Relationships

- **Many-to-One:** `candidate.created_by_user_id` → `user.id` (who created the candidate)
- **One-to-Many:** `candidate.jobs` → `candidate_job` (job applications)
- **Many-to-Many:** `candidate.assigned_users` ↔ `user` (assigned users)
- **One-to-Many:** `candidate.resume_jobs` → `resume_generation_job` (async resume jobs)

### Indexes

- `uq_candidate_ssn` (UNIQUE on `ssn`)
- `ix_candidate_ssn` (INDEX on `ssn`)
- `fk_candidate_user` (Foreign Key to `user.id`)

### Usage

```python
# Example: Create a candidate
candidate = Candidate(
    created_by_user_id=1,
    first_name="Jane",
    last_name="Smith",
    email="jane@example.com",
    phone="+1987654321",
    ssn="123456789",
    role="Software Engineer",
    # ... additional fields
)

# Example: Query candidates created by a user
user_candidates = Candidate.query.filter_by(created_by_user_id=user_id).all()

# Example: Candidate login (phone + password)
```

### Notes

- SSN must be unique across all candidates
- Boolean fields default to `False` if not specified
- Large text fields (technical_skills, work_experience, education, certificates) can store JSON or formatted text
- Candidate can be assigned to multiple users via the association table

---

## Table: `candidate_job`

**Purpose:** Tracks job applications per candidate, storing job descriptions and generated resumes.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-incrementing job application ID |
| `candidate_id` | INTEGER | NOT NULL, FK → candidate.id, INDEX | Reference to candidate |
| `job_id` | TEXT | NOT NULL | Job identifier or title |
| `job_description` | TEXT | NOT NULL | Full job description text |
| `resume_content` | TEXT | NULLABLE | Generated resume content |
| `docx_path` | VARCHAR(512) | NULLABLE | File path to saved DOCX resume |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT=now(), INDEX | Application timestamp |

### Relationships

- **Many-to-One:** `candidate_job.candidate_id` → `candidate.id`
- **One-to-Many:** `candidate_job.generation_jobs` → `resume_generation_job`

### Indexes

- `ix_candidate_job_candidate_id` (INDEX on `candidate_id`)
- `ix_candidate_job_created_at` (INDEX on `created_at`)
- `fk_candidate_job_candidate` (Foreign Key with CASCADE delete)

### Usage

```python
# Example: Create a job application
job = CandidateJob(
    candidate_id=1,
    job_id="SOFTWARE_ENGINEER_001",
    job_description="Looking for an experienced software engineer...",
)

# Example: Get all jobs for a candidate
candidate_jobs = CandidateJob.query.filter_by(candidate_id=candidate_id).all()

# Example: Update with generated resume
job.resume_content = generated_resume_text
job.docx_path = "/path/to/resume.docx"
```

### Notes

- Each candidate can have multiple job applications
- `job_id` is TEXT to allow long job IDs or full descriptions
- Resumes are generated using AI (OpenAI) based on job description
- Cascade delete: if a candidate is deleted, all their jobs are deleted too

---

## Table: `candidate_assigned_users`

**Purpose:** Association table for many-to-many relationship between candidates and assigned users.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `candidate_id` | INTEGER | PRIMARY KEY, FK → candidate.id | Candidate ID |
| `user_id` | INTEGER | PRIMARY KEY, FK → user.id | User ID |
| `assigned_at` | TIMESTAMP | NOT NULL, DEFAULT=now() | Assignment timestamp |

### Relationships

- **Many-to-Many:** Links `candidate` and `user` tables

### Foreign Keys

- `candidate_assigned_users.candidate_id` → `candidate.id` (CASCADE delete)
- `candidate_assigned_users.user_id` → `user.id` (CASCADE delete)

### Usage

```python
# Example: Assign users to a candidate
candidate = Candidate.query.get(candidate_id)
assigned_user = User.query.get(user_id)
candidate.assigned_users.append(assigned_user)
db.session.commit()

# Example: Query all candidates assigned to a user
user = User.query.get(user_id)
assigned_candidates = user.assigned_candidates.all()

# Example: Remove assignment
candidate.assigned_users.remove(assigned_user)
db.session.commit()
```

### Notes

- Composite primary key: (`candidate_id`, `user_id`)
- Cascade delete: if candidate or user is deleted, assignments are deleted too
- Automatically tracks when assignment was created

---

## Table: `resume_generation_job`

**Purpose:** Tracks asynchronous resume generation jobs using Celery background workers.

### Schema

#### Identification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Celery task ID (UUID) |
| `candidate_id` | INTEGER | NOT NULL, FK → candidate.id, INDEX | Reference to candidate |
| `job_row_id` | INTEGER | NULLABLE, FK → candidate_job.id, INDEX | Reference to candidate_job |

#### Job Status

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `status` | VARCHAR(50) | NOT NULL, DEFAULT='PENDING', INDEX | Job status: PENDING, PROCESSING, SUCCESS, FAILURE |
| `progress` | INTEGER | NOT NULL, DEFAULT=0 | Progress percentage (0-100) |
| `file_type` | VARCHAR(20) | NOT NULL, DEFAULT='word' | Output format: "word" or "pdf" |

#### Results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `result_url` | VARCHAR(512) | NULLABLE | URL or filename to download resume |
| `error_message` | TEXT | NULLABLE | Error details if job failed |

#### Timestamps

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT=now(), INDEX | Job creation timestamp |
| `started_at` | TIMESTAMP | NULLABLE | When processing started |
| `completed_at` | TIMESTAMP | NULLABLE | When processing completed |

### Relationships

- **Many-to-One:** `resume_generation_job.candidate_id` → `candidate.id`
- **Many-to-One:** `resume_generation_job.job_row_id` → `candidate_job.id`

### Indexes

- `ix_resume_generation_job_candidate_id` (INDEX on `candidate_id`)
- `ix_resume_generation_job_job_row_id` (INDEX on `job_row_id`)
- `ix_resume_generation_job_status` (INDEX on `status`)
- `ix_resume_generation_job_created_at` (INDEX on `created_at`)

### Usage

```python
# Example: Create a resume generation job
job = ResumeGenerationJob(
    id=celery_task_id,  # From Celery
    candidate_id=1,
    job_row_id=job_row_id,
    status='PENDING',
    file_type='word'
)
db.session.add(job)
db.session.commit()

# Example: Update job progress
job.status = 'PROCESSING'
job.progress = 50
job.started_at = datetime.utcnow()
db.session.commit()

# Example: Mark job as complete
job.status = 'SUCCESS'
job.progress = 100
job.completed_at = datetime.utcnow()
job.result_url = 'resume_abc123.docx'
db.session.commit()

# Example: Query user's recent jobs
recent_jobs = ResumeGenerationJob.query\
    .filter_by(candidate_id=candidate_id)\
    .order_by(ResumeGenerationJob.created_at.desc())\
    .limit(10)\
    .all()
```

### Job Status Flow

```
PENDING → PROCESSING → SUCCESS
                        ↓
                      FAILURE
```

- **PENDING:** Job queued, not started yet
- **PROCESSING:** Celery worker is actively generating the resume
- **SUCCESS:** Resume generated successfully, ready for download
- **FAILURE:** Error occurred, check `error_message` for details

### Notes

- Primary key is a VARCHAR (Celery task UUID), not auto-incrementing
- Jobs are processed asynchronously by Celery workers
- Results are cached in Redis for 1 hour to avoid re-generating identical resumes
- Frontend polls job status every 2 seconds until completion
- Supports both Word (.docx) and PDF file types

---

## Database Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER TABLE                               │
│  id, name, email, mobile, password_hash, role, created_at       │
└─────────────┬──────────────────────────────────┬────────────────┘
              │                                  │
              │ (1:N)                            │ (N:M)
              │ creates                          │ assigned_to
              │                                  │
              ▼                                  ▼
┌─────────────────────────────────────────┐  ┌──────────────────────────────┐
│           CANDIDATE TABLE               │  │  candidate_assigned_users    │
│  id, created_by_user_id, first_name,   │  │  candidate_id (PK, FK)        │
│  last_name, email, phone, password,    │  │  user_id (PK, FK)             │
│  ssn, birthdate, gender, role,          │  │  assigned_at                 │
│  address, skills, experience, etc.      │  └──────────────────────────────┘
└─────────────┬──────────────────────────────┐
              │                              │
              │ (1:N)                        │ (1:N)
              │ has_many                     │ generates
              │                              │
              ▼                              ▼
┌─────────────────────────────┐  ┌────────────────────────────────────────┐
│    CANDIDATE_JOB TABLE      │  │  RESUME_GENERATION_JOB TABLE           │
│  id, candidate_id (FK),     │  │  id (Celery task),                     │
│  job_id, job_description,   │  │  candidate_id (FK),                    │
│  resume_content, docx_path, │  │  job_row_id (FK),                      │
│  created_at                 │  │  status, progress, result_url,          │
└─────────────────────────────┘  │  error_message, timestamps             │
                                 └────────────────────────────────────────┘
```

---

## Index Summary

| Table | Index Name | Columns | Type |
|-------|------------|---------|------|
| `user` | `uq_user_email` | `email` | UNIQUE |
| `user` | `uq_user_mobile` | `mobile` | UNIQUE |
| `user` | `ix_user_email` | `email` | INDEX |
| `user` | `ix_user_mobile` | `mobile` | INDEX |
| `candidate` | `uq_candidate_ssn` | `ssn` | UNIQUE |
| `candidate` | `ix_candidate_ssn` | `ssn` | INDEX |
| `candidate_job` | `ix_candidate_job_candidate_id` | `candidate_id` | INDEX |
| `candidate_job` | `ix_candidate_job_created_at` | `created_at` | INDEX |
| `resume_generation_job` | `ix_resume_generation_job_candidate_id` | `candidate_id` | INDEX |
| `resume_generation_job` | `ix_resume_generation_job_job_row_id` | `job_row_id` | INDEX |
| `resume_generation_job` | `ix_resume_generation_job_status` | `status` | INDEX |
| `resume_generation_job` | `ix_resume_generation_job_created_at` | `created_at` | INDEX |

---

## Foreign Key Constraints

| Constraint | Table | Column | References | On Delete |
|------------|-------|--------|------------|-----------|
| `fk_candidate_user` | `candidate` | `created_by_user_id` | `user.id` | - |
| `fk_candidate_job_candidate` | `candidate_job` | `candidate_id` | `candidate.id` | CASCADE |
| (multiple) | `candidate_assigned_users` | `candidate_id` | `candidate.id` | CASCADE |
| (multiple) | `candidate_assigned_users` | `user_id` | `user.id` | CASCADE |
| (multiple) | `resume_generation_job` | `candidate_id` | `candidate.id` | CASCADE |
| (multiple) | `resume_generation_job` | `job_row_id` | `candidate_job.id` | SET NULL |

---

## Migration Files

### 1. Initial Schema (`85fc35d7805b_initial_schema.py`)

Creates the initial database structure:
- `user` table
- `candidate` table
- `candidate_job` table
- Base indexes and foreign keys

### 2. Role and Async Resume Support (`f1f2c3d4e5f6_add_role_and_async_resume_support.py`)

Adds enhancements:
- `role` column to `candidate` table
- Widens `job_id` in `candidate_job` from VARCHAR(120) to TEXT
- Creates `candidate_assigned_users` association table
- Creates `resume_generation_job` table with all indexes
- Additional indexes for query optimization

---

## Data Integrity Rules

1. **User Email & Mobile:** Must be unique across all users
2. **Candidate SSN:** Must be unique across all candidates
3. **Password Security:** All passwords must be hashed (never stored in plaintext)
4. **Cascade Deletes:**
   - Deleting a user does NOT delete their created candidates (foreign key without CASCADE)
   - Deleting a candidate DOES delete their job applications and resume generation jobs
   - Deleting a user or candidate DOES delete their assignment records
5. **Job Status:** Only valid values are: PENDING, PROCESSING, SUCCESS, FAILURE
6. **Progress:** Must be between 0 and 100 for resume generation jobs

---

## Performance Considerations

1. **Indexes:** All frequently queried columns are indexed:
   - User lookups by email/mobile
   - Candidate lookups by SSN
   - Job lookups by candidate_id and creation date
   - Resume job lookups by candidate_id, job_row_id, status, and creation date

2. **Text Fields:** Large text fields (job descriptions, resume content, etc.) should be used sparingly in joins or where clauses

3. **Cascade Deletes:** Ensure proper transaction handling when deleting candidates to avoid orphaned records

4. **Async Processing:** Resume generation jobs are processed in background to avoid blocking API requests

---

## Security Considerations

1. **Passwords:** Stored as hashes using Werkzeug's `generate_password_hash`
2. **SSN:** Sensitive data, should be encrypted in production
3. **Authorization:** Role-based access control (admin vs. user)
4. **Input Validation:** All user inputs should be validated before insertion
5. **SQL Injection:** SQLAlchemy ORM protects against SQL injection
6. **Rate Limiting:** API endpoints are rate-limited to prevent abuse

---

## Common Queries

### Get all candidates for a user (with creator info)
```python
candidates = Candidate.query\
    .filter_by(created_by_user_id=user_id)\
    .options(joinedload(Candidate.creator))\
    .all()
```

### Get all assigned candidates for a user
```python
user = User.query.get(user_id)
assigned_candidates = user.assigned_candidates.all()
```

### Get pending resume generation jobs
```python
pending_jobs = ResumeGenerationJob.query\
    .filter_by(status='PENDING')\
    .order_by(ResumeGenerationJob.created_at.asc())\
    .all()
```

### Get recent job applications for a candidate
```python
recent_jobs = CandidateJob.query\
    .filter_by(candidate_id=candidate_id)\
    .order_by(CandidateJob.created_at.desc())\
    .limit(10)\
    .all()
```

---

## Future Enhancements

Potential additions to the database schema:

1. **Audit Trail:** Track all changes to candidate records
2. **User Sessions:** Store active sessions and JWT tokens
3. **Email Templates:** Store customizable email templates
4. **Interview Scheduling:** Track interview appointments and statuses
5. **Application Status:** Track application status (pending, rejected, hired, etc.)
6. **Skills Taxonomy:** Normalize technical skills into a separate table
7. **Companies:** Store company/organization information
8. **Job Postings:** Store job postings separately from applications

---

**Last Updated:** Based on codebase as of current date  
**Database System:** PostgreSQL  
**ORM:** SQLAlchemy  
**Migration Tool:** Alembic

