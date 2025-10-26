# Developer Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend (Flask)](#backend-flask)
4. [Frontend (React)](#frontend-react)
5. [Chrome Extension](#chrome-extension)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Development Setup](#development-setup)
9. [Key Features](#key-features)

---

## Project Overview

**Data Fyre Candidate Management System** is a comprehensive platform for managing job candidates with AI-powered resume generation and form autofill capabilities. The system consists of three main components:

- **Backend API** (Flask + PostgreSQL)
- **Frontend Web App** (React + Vite + Material-UI)
- **Chrome Extension** (Vanilla JavaScript)

### Tech Stack

**Backend:**
- Flask 3.0.3 (Python Web Framework)
- PostgreSQL (Database)
- SQLAlchemy (ORM)
- Flask-JWT-Extended (Authentication)
- OpenAI API (AI-powered features)
- python-docx (Resume generation)

**Frontend:**
- React 19.1.1
- Vite (Build tool)
- Material-UI (UI Components)
- React Router (Navigation)

**Extension:**
- Manifest V3
- Content Scripts for form autofill
- Chrome Storage API

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
├──────────────────┬──────────────────┬───────────────────┤
│  React Frontend  │ Chrome Extension │  Direct API Calls │
└────────┬─────────┴────────┬─────────┴──────────┬────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   Flask API     │
                   │   (Backend)     │
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌──────▼──────┐   ┌──────▼──────┐
    │PostgreSQL│      │  OpenAI API │   │ File System │
    │ Database │      │  (GPT-4)    │   │   (.docx)   │
    └─────────┘      └─────────────┘   └─────────────┘
```

---

## Backend (Flask)

### Project Structure

```
backend/
├── app/
│   ├── __init__.py          # App factory, blueprints registration
│   ├── models.py            # Database models (User, Candidate, CandidateJob)
│   ├── auth.py              # Authentication routes (login, logout, token)
│   ├── admin.py             # Admin routes (user management, candidate overview)
│   ├── candidates.py        # Candidate CRUD operations
│   ├── ai.py                # AI-powered field mapping
│   ├── candidateresumebuilder.py  # Resume generation with OpenAI
│   ├── public.py            # Public API endpoints (for extension)
│   └── utils.py             # Utility functions
├── migrations/              # Database migrations (Alembic)
├── config.py                # Configuration (database, JWT, CORS)
├── requirements.txt         # Python dependencies
└── wsgi.py                  # WSGI entry point
```

### Key Modules

#### `models.py` - Database Models

**User Model:**
- Represents admin and regular users
- Fields: `name`, `email`, `mobile`, `password_hash`, `role`
- Roles: `admin` (full access) or `user` (limited access)

**Candidate Model:**
- Comprehensive candidate information
- Personal info, address, visa status, work authorization
- Technical skills, work experience, education
- Relationship: `created_by_user_id` (foreign key to User)

**CandidateJob Model:**
- Tracks job applications per candidate
- Fields: `candidate_id`, `job_id`, `job_description`, `resume_content`, `docx_path`

#### `auth.py` - Authentication

Three types of login:
1. **Admin Login** (`/api/auth/login-admin`)
   - Email + Password
   - Returns JWT cookie

2. **User Login** (`/api/auth/login-user`)
   - Mobile + Password
   - Returns JWT cookie

3. **Candidate Login** (`/api/auth/login-candidate`)
   - Phone + Password
   - Returns JWT cookie

**Token-based Auth for Extension:**
- `/api/auth/token-admin` - Returns access token in JSON (no cookies)
- `/api/auth/token-user` - Returns access token in JSON

#### `candidateresumebuilder.py` - AI Resume Generation

```python
POST /api/resume/generate
```

**Flow:**
1. Receives job description and candidate info
2. Sends to OpenAI GPT-4 with structured prompt
3. Generates tailored resume in JSON format
4. Converts to Word document (.docx) using python-docx
5. Optionally saves to database (if `candidate_id` provided)
6. Returns file as download

**Key Function:**
```python
def call_openai(job_description: str, candidate_info: dict) -> dict:
    # Uses OpenAI API to generate structured resume
    # Returns JSON with sections: header, summary, skills, experience, education
```

#### `ai.py` - AI Field Mapping

```python
POST /api/ai/map-fields
```

**Purpose:** Maps candidate data to arbitrary form fields using AI

**Flow:**
1. Receives candidate data and form schema
2. Uses GPT-4 to intelligently map candidate fields to form fields
3. Returns JSON mapping: `{ "form_field_name": "value_to_fill" }`

Example:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email_address": "john.doe@example.com",
  "phone": "+1-555-0123"
}
```

#### `public.py` - Public API (for Extension)

No authentication required:
- `GET /api/public/users` - List all users
- `GET /api/public/candidates` - List all candidates
- `GET /api/public/candidates/<id>` - Get candidate details

### Configuration (`config.py`)

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `OPENAI_API_KEY` - OpenAI API key (in .env)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` - Default admin credentials
- `FRONTEND_URL` - Frontend URL for CORS

**JWT Configuration:**
- Supports both cookies (web) and headers (extension)
- Cookie settings: Secure in production, Lax/None SameSite
- Token location: `["cookies", "headers"]`

### Database Migrations

Using Flask-Migrate (Alembic):

```bash
# Create migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade

# Rollback
flask db downgrade
```

---

## Frontend (React)

### Project Structure

```
frontend/
├── src/
│   ├── main.jsx             # Entry point
│   ├── App.css              # Global styles
│   ├── api.js               # API client functions
│   ├── AuthContext.jsx      # Authentication context
│   ├── ProtectedRoute.jsx   # Route protection HOC
│   ├── components/
│   │   └── CandidateForm.jsx  # Candidate create/edit form
│   ├── pages/
│   │   ├── Login.jsx            # Login router
│   │   ├── LoginAdmin.jsx       # Admin login page
│   │   ├── LoginUser.jsx        # User login page
│   │   ├── LoginCandidate.jsx   # Candidate login page
│   │   ├── Admin.jsx            # Admin dashboard
│   │   ├── UserDashboard.jsx    # User dashboard
│   │   ├── CandidateDashboard.jsx  # Candidate dashboard
│   │   ├── Dashboard.jsx        # Generic dashboard
│   │   └── CandidateDetail.jsx  # Candidate detail/jobs
│   ├── constants/
│   │   └── options.js        # Dropdown options (visa, citizenship, etc.)
│   └── utils/
│       ├── candidate.js      # Candidate utility functions
│       └── display.js        # Display formatting utilities
├── public/
├── index.html
├── package.json
└── vite.config.js
```

### Key Components

#### `AuthContext.jsx` - Authentication State Management

Provides global auth state:
```javascript
const { user, role, login, logout, loading } = useAuth();
```

**Functions:**
- `login(role, credentials)` - Calls appropriate login API
- `logout()` - Clears session
- `checkAuth()` - Validates existing session

#### `api.js` - API Client

Centralized API calls with credential support:

```javascript
// Generic API function
export async function api(path, { method="GET", body } = {})

// Auth APIs
export const loginAdmin, loginUser, loginCandidate
export const meApi, logoutApi

// Admin APIs
export const listUsers, createUser, updateUser, deleteUser
export const listAllCandidates, adminUpdateCandidate, adminDeleteCandidate

// User APIs
export const listMyCandidates, createCandidate, updateCandidate, deleteCandidate

// Candidate APIs
export const getMyCandidateProfile, updateMyCandidateProfile
export const getCandidate, listCandidateJobs, addCandidateJob

// Resume APIs
export const generateResume
```

#### `CandidateForm.jsx` - Candidate Form Component

Comprehensive form with:
- Personal information
- Address
- Visa/work authorization
- Skills, experience, education
- Form validation
- Create/Edit modes

#### `CandidateDetail.jsx` - Candidate Job Management

Features:
- Display candidate details
- Add job applications (job ID + description)
- Generate tailored resumes per job
- View/download previous resumes
- Delete job applications

### Routing

```javascript
/                           → Login router
/login-admin                → Admin login
/login-user                 → User login
/login-candidate            → Candidate login
/admin                      → Admin dashboard (protected)
/user                       → User dashboard (protected)
/candidate                  → Candidate dashboard (protected)
/candidates/:id             → Candidate detail (protected)
```

### UI/UX

- **Material-UI** for consistent design
- **Responsive** layout
- **Loading states** and error handling
- **Toast notifications** (MUI Snackbar)
- **Form validation**

---

## Chrome Extension

### Project Structure

```
extension/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic (user/candidate selection)
├── content.js         # Content script (form detection/filling)
└── only_logo.png      # Extension icon
```

### Manifest V3 Configuration

**Permissions:**
- `storage` - Store backend URL and settings
- `tabs` - Access active tab
- `scripting` - Inject content scripts

**Host Permissions:**
- Access to backend API (localhost + production)
- All HTTP/HTTPS pages for form autofill

### Architecture Flow

```
┌──────────────┐
│ popup.html   │ ← User interface
└──────┬───────┘
       │
┌──────▼───────┐
│  popup.js    │ ← Logic: API calls, user selection
└──────┬───────┘
       │
       ├─────→ Backend API (fetch user/candidate data)
       │
       └─────→ content.js (inject into page)
                    │
            ┌───────▼────────┐
            │ Web Page Forms │ ← Autofill target
            └────────────────┘
```

### Key Files

#### `popup.js` - Extension Logic

**Features:**
1. **API Auto-detection**
   - Tries multiple candidate URLs (localhost:5000, current domain)
   - Tests `/api/public/users` endpoint
   - Stores working backend URL

2. **User/Candidate Selection**
   - Loads all users (filters out admins)
   - Loads candidates for selected user
   - Dropdown UI for selection

3. **Autofill Process**
   ```javascript
   1. Collect form data from page (via content.js)
   2. Send to backend AI mapping API
   3. Receive field mapping
   4. Send mapping to content.js for filling
   ```

**Key Functions:**
```javascript
async function autoDetectBase()           // Find backend URL
async function loadUsersAndCandidates()   // Load data for dropdowns
async function collectFormFromPage()      // Get form schema
```

#### `content.js` - Form Interaction

**Responsibilities:**
1. **Scan page for form fields**
   - Detects input types: text, email, tel, select, textarea, radio, checkbox
   - Extracts field metadata: name, id, type, label, placeholder

2. **Fill form fields**
   - Receives mapping from popup.js
   - Matches fields by name/id
   - Handles different input types appropriately
   - Triggers change events for validation

**Message Handlers:**
```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "collectFormData") {
    // Return form schema
  }
  if (msg.action === "autofillForm") {
    // Fill form with provided data
  }
});
```

### Extension Usage

1. **Install Extension** (Developer Mode)
2. **Navigate to job application form**
3. **Click extension icon**
4. **Select User** (dropdown)
5. **Select Candidate** (dropdown)
6. **Click "Autofill"**
7. **AI maps fields and fills form automatically**

---

## Database Schema

### Users Table

| Column          | Type         | Description                  |
|-----------------|--------------|------------------------------|
| id              | Integer      | Primary key                  |
| name            | String(120)  | User's full name             |
| email           | String(255)  | Unique email                 |
| mobile          | String(30)   | Unique mobile number         |
| password_hash   | String(255)  | Hashed password              |
| role            | String(20)   | 'admin' or 'user'            |
| created_at      | DateTime     | Creation timestamp           |
| updated_at      | DateTime     | Last update timestamp        |

### Candidates Table

| Column                          | Type         | Description                    |
|---------------------------------|--------------|--------------------------------|
| id                              | Integer      | Primary key                    |
| created_by_user_id              | Integer      | Foreign key to User            |
| first_name                      | String(120)  | First name                     |
| last_name                       | String(120)  | Last name                      |
| email                           | String(255)  | Email address                  |
| phone                           | String(50)   | Phone number                   |
| subscription_type               | String(50)   | 'Gold' or 'Silver'             |
| password                        | String(255)  | Plain text password (min 6)    |
| birthdate                       | Date         | Date of birth                  |
| gender                          | String(50)   | Gender                         |
| nationality                     | String(120)  | Nationality                    |
| citizenship_status              | String(120)  | Citizenship status             |
| visa_status                     | String(120)  | Current visa status            |
| f1_type                         | String(120)  | F1 type (Post/STEM OPT)        |
| work_authorization              | String(120)  | Work authorization             |
| willing_relocate                | Boolean      | Willing to relocate?           |
| willing_travel                  | Boolean      | Willing to travel?             |
| disability_status               | Boolean      | Has disability?                |
| veteran_status                  | String(120)  | Veteran status                 |
| military_experience             | Boolean      | Military experience?           |
| race_ethnicity                  | String(120)  | Race/ethnicity                 |
| expected_wage                   | String(120)  | Expected salary/wage           |
| contact_current_employer        | String(120)  | OK to contact current employer?|
| recent_degree                   | String(255)  | Most recent degree             |
| authorized_work_us              | String(120)  | Authorized to work in US?      |
| authorized_without_sponsorship  | String(120)  | Work without sponsorship?      |
| referral_source                 | String(255)  | How they heard about job       |
| at_least_18                     | String(10)   | At least 18 years old?         |
| needs_visa_sponsorship          | String(120)  | Needs visa sponsorship?        |
| family_in_org                   | String(255)  | Family in organization?        |
| availability                    | String(120)  | Availability to start          |
| address_line1                   | String(255)  | Address line 1                 |
| address_line2                   | String(255)  | Address line 2                 |
| city                            | String(120)  | City                           |
| state                           | String(120)  | State                          |
| postal_code                     | String(40)   | Postal/ZIP code                |
| country                         | String(120)  | Country                        |
| personal_website                | String(255)  | Personal website URL           |
| linkedin                        | String(255)  | LinkedIn URL                   |
| github                          | String(255)  | GitHub URL                     |
| technical_skills                | Text         | JSON: Technical skills         |
| work_experience                 | Text         | JSON: Work experience          |
| education                       | Text         | JSON: Education                |
| certificates                    | Text         | JSON: Certificates             |
| created_at                      | DateTime     | Creation timestamp             |
| updated_at                      | DateTime     | Last update timestamp          |

### CandidateJob Table

| Column           | Type         | Description                      |
|------------------|--------------|----------------------------------|
| id               | Integer      | Primary key                      |
| candidate_id     | Integer      | Foreign key to Candidate         |
| job_id           | String(120)  | Job identifier                   |
| job_description  | Text         | Full job description             |
| resume_content   | Text         | Generated resume (JSON/text)     |
| docx_path        | String(512)  | Path to saved Word document      |
| created_at       | DateTime     | Creation timestamp               |

---

## API Endpoints

### Authentication

| Method | Endpoint                       | Description                      | Auth Required |
|--------|--------------------------------|----------------------------------|---------------|
| POST   | `/api/auth/login-admin`        | Admin login (email + password)   | No            |
| POST   | `/api/auth/login-user`         | User login (mobile + password)   | No            |
| POST   | `/api/auth/login-candidate`    | Candidate login (phone + pwd)    | No            |
| POST   | `/api/auth/token-admin`        | Get JWT token for extension      | No            |
| POST   | `/api/auth/token-user`         | Get JWT token for extension      | No            |
| GET    | `/api/auth/me`                 | Get current user info            | Yes           |
| POST   | `/api/auth/logout`             | Logout (clear cookies)           | No            |

### Admin Routes

| Method | Endpoint                          | Description                  | Role Required |
|--------|-----------------------------------|------------------------------|---------------|
| GET    | `/api/admin/users`                | List all users               | Admin         |
| POST   | `/api/admin/users`                | Create new user              | Admin         |
| PUT    | `/api/admin/users/<id>`           | Update user                  | Admin         |
| DELETE | `/api/admin/users/<id>`           | Delete user                  | Admin         |
| GET    | `/api/admin/candidates`           | List all candidates          | Admin         |
| PUT    | `/api/admin/candidates/<id>`      | Update candidate             | Admin         |
| DELETE | `/api/admin/candidates/<id>`      | Delete candidate             | Admin         |

### User/Candidate Routes

| Method | Endpoint                              | Description                      | Role Required |
|--------|---------------------------------------|----------------------------------|---------------|
| GET    | `/api/candidates`                     | List my candidates (user only)   | User          |
| POST   | `/api/candidates`                     | Create candidate (user only)     | User          |
| GET    | `/api/candidates/<id>`                | Get candidate details            | User/Admin    |
| PUT    | `/api/candidates/<id>`                | Update candidate (user only)     | User          |
| DELETE | `/api/candidates/<id>`                | Delete candidate (user only)     | User          |
| GET    | `/api/candidates/me`                  | Get my profile (candidate only)  | Candidate     |
| PUT    | `/api/candidates/me`                  | Update my profile (candidate)    | Candidate     |
| GET    | `/api/candidates/<id>/jobs`           | List jobs for candidate          | User/Admin    |
| POST   | `/api/candidates/<id>/jobs`           | Add job for candidate            | User/Admin    |
| PUT    | `/api/candidates/<id>/jobs/<job_id>`  | Update job                       | User/Admin    |
| DELETE | `/api/candidates/<id>/jobs/<job_id>`  | Delete job                       | User/Admin    |

### AI & Resume Routes

| Method | Endpoint                     | Description                         | Auth Required |
|--------|------------------------------|-------------------------------------|---------------|
| POST   | `/api/ai/map-fields`         | AI field mapping for autofill       | Yes           |
| POST   | `/api/resume/generate`       | Generate tailored resume            | Yes           |

### Public Routes (No Auth)

| Method | Endpoint                           | Description                  |
|--------|------------------------------------|------------------------------|
| GET    | `/api/public/users`                | List all users (for extension)|
| GET    | `/api/public/candidates`           | List all candidates          |
| GET    | `/api/public/candidates/<id>`      | Get candidate details        |

### Health Check

| Method | Endpoint           | Description      |
|--------|--------------------|------------------|
| GET    | `/api/healthz`     | Health check     |

---

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- OpenAI API key

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:admin@localhost:5432/flask_app_db
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
OPENAI_API_KEY=your-openai-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Passw0rd!
FLASK_ENV=development
EOF

# Initialize database
flask db upgrade

# Run development server
flask run
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Run development server
npm run dev
# Server runs on http://localhost:5173
```

### Extension Setup

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Extension is now installed

---

## Key Features

### 1. Multi-Role Authentication
- **Admin:** Full system access
- **User:** Manage own candidates
- **Candidate:** Self-service profile management

### 2. Candidate Management
- Comprehensive candidate profiles
- Skills, experience, education tracking
- Job application tracking per candidate
- User-candidate ownership model

### 3. AI-Powered Resume Generation
- Tailored resumes per job description
- Uses OpenAI GPT-4
- Outputs Word documents (.docx)
- Saves resume history

### 4. Chrome Extension Autofill
- Intelligent form detection
- AI field mapping
- One-click autofill
- Works on any website

### 5. API-First Design
- RESTful API
- JWT authentication
- CORS support
- Public endpoints for extension

### 6. Database Migrations
- Version-controlled schema
- Easy rollback
- Production-safe

---

## Testing

### Backend Tests

```bash
# Run tests (if test suite exists)
pytest

# Check code quality
flake8 app/
```

### Frontend Tests

```bash
# Run tests
npm test

# Lint
npm run lint
```

---

## Common Development Tasks

### Add New API Endpoint

1. Create route in appropriate blueprint (`app/candidates.py`, etc.)
2. Add API function in `frontend/src/api.js`
3. Use in React component

### Add Database Field

1. Update model in `app/models.py`
2. Create migration: `flask db migrate -m "Add field"`
3. Apply: `flask db upgrade`
4. Update frontend form and API calls

### Update Extension

1. Modify `popup.js` or `content.js`
2. Go to `chrome://extensions`
3. Click refresh icon on extension

---

## Troubleshooting

### Backend won't start
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Run migrations: `flask db upgrade`

### Frontend can't connect to API
- Check VITE_API_URL in .env
- Verify backend is running on correct port
- Check CORS settings in `backend/config.py`

### Extension not working
- Check host permissions in `manifest.json`
- Open browser console for errors
- Verify backend URL is accessible

---

## Code Style Guidelines

### Python (Backend)
- Follow PEP 8
- Use type hints where appropriate
- Document functions with docstrings

### JavaScript (Frontend/Extension)
- Use ES6+ features
- Async/await for promises
- Meaningful variable names

### React
- Functional components with hooks
- PropTypes for component props
- Keep components small and focused

---

## Environment Variables

### Backend (.env)

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-key
OPENAI_API_KEY=sk-...

# Optional
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
ADMIN_MOBILE=9999999999
ADMIN_NAME=Administrator
FLASK_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5000/api
```

---

## Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [OpenAI API](https://platform.openai.com/docs/)

---

**Last Updated:** October 2025

