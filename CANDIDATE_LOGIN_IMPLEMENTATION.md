# Candidate Login System Implementation

## Overview
Implemented a complete candidate login system allowing candidates to log in using their mobile number and password, then view their basic information and applied jobs.

## Features Implemented

### 1. Candidate Authentication
- **Login using mobile number and password**
- Password validation (minimum 6 characters)
- JWT-based authentication with role "candidate"
- Hide/show password toggle for better UX

### 2. Candidate Dashboard
- **Basic Information Display**:
  - Full Name
  - Email Address
  - Mobile Number
  
- **Jobs Applied Table**:
  - Job ID
  - Job Description
  - Resume Status (Generated/Pending)
  - Application Date

### 3. Access Control
- Role-based routing
- Protected routes for candidate-only access
- Automatic redirect based on user role

## Files Created/Modified

### Backend Files

#### 1. `backend/app/auth.py`
**Added:**
- `login_candidate()` endpoint at `/auth/login-candidate`
  - Validates phone number and password
  - Creates JWT token with candidate role
  - Returns authentication cookie

**Key Changes:**
```python
# Candidate login (phone + password)
@bp.post("/login-candidate")
def login_candidate():
    # Validates phone + password
    # Returns JWT with role="candidate"
```

#### 2. `backend/app/candidates.py`
**Added:**
- `current_candidate_id()` helper function
- `/candidates/me` endpoint for candidates to fetch their own profile
  - Returns candidate info with jobs list
  - Only accessible by authenticated candidates

**Key Changes:**
```python
@bp.get("/me")
@jwt_required()
def get_my_profile():
    """Get logged-in candidate's own profile and jobs"""
```

### Frontend Files

#### 3. `frontend/src/pages/LoginCandidate.jsx` (NEW)
**Features:**
- Phone number input field
- Password field with hide/show toggle
- Client-side validation
- Links to User and Admin login pages
- Material-UI styled components

#### 4. `frontend/src/pages/CandidateDashboard.jsx` (NEW)
**Features:**
- Welcome header with candidate name
- Logout functionality
- Basic information cards (Name, Email, Phone)
- Jobs applied table with:
  - Job ID
  - Job Description
  - Resume Status indicator
  - Application Date
- Empty state message when no jobs applied

#### 5. `frontend/src/api.js`
**Added:**
- `loginCandidate(phone, password)` - Candidate login API call
- `getMyCandidateProfile()` - Fetch candidate's own profile

#### 6. `frontend/src/main.jsx`
**Added Routes:**
- `/login-candidate` - Candidate login page
- `/candidate-dashboard` - Candidate dashboard (protected)

**Updated:**
- `RoleRedirect()` to handle candidate role
- Route protection for candidate-specific pages

#### 7. `frontend/src/pages/LoginUser.jsx`
**Added:**
- Link to candidate login page

#### 8. `frontend/src/pages/LoginAdmin.jsx`
**Added:**
- Link to candidate login page

## Authentication Flow

### Login Process
1. Candidate enters phone number and password
2. Frontend validates input (digits only, min 6 chars)
3. POST request to `/api/auth/login-candidate`
4. Backend validates credentials
5. JWT token created with candidate role and ID
6. Token stored in HTTP-only cookie
7. Redirect to `/candidate-dashboard`

### Dashboard Access
1. Protected route checks JWT token
2. If role is "candidate", allow access
3. Dashboard fetches data from `/api/candidates/me`
4. Display candidate info and jobs

## JWT Token Claims

When a candidate logs in, the JWT includes:
```javascript
{
  identity: "candidate_{id}",
  role: "candidate",
  candidate_id: 123,
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890"
}
```

## API Endpoints

### Authentication
- **POST** `/api/auth/login-candidate`
  - Body: `{ phone, password }`
  - Response: Sets JWT cookie, returns `{ message, role }`

### Candidate Profile
- **GET** `/api/candidates/me`
  - Headers: JWT token (cookie)
  - Response: Candidate object with jobs array

## Validation Rules

### Login Form
1. **Phone Number**:
   - Required field
   - Must contain only digits
   - No special characters or spaces

2. **Password**:
   - Required field
   - Minimum 6 characters
   - Hide/show toggle available

### Backend
1. **Authentication**:
   - Phone number must exist in database
   - Password must match exactly (plain text comparison)
   - Returns 401 for invalid credentials

## Security Considerations

### Current Implementation
- ✅ JWT-based authentication
- ✅ HTTP-only cookies
- ✅ Role-based access control
- ✅ Protected routes
- ⚠️ Password stored as plain text

### Recommended Improvements for Production
1. **Hash passwords** using bcrypt or similar
2. Add CSRF protection
3. Implement rate limiting on login endpoint
4. Add account lockout after failed attempts
5. Use HTTPS in production
6. Add session timeout/refresh tokens

## User Experience

### Candidate Login Page
- Clean, modern Material-UI design
- Easy-to-understand form fields
- Helpful validation messages
- Quick links to other login types
- Mobile-responsive layout

### Candidate Dashboard
- Professional card-based layout
- Clear information hierarchy
- Color-coded resume status
- Responsive table for jobs
- Empty state with helpful message
- Easy logout access

## Testing Checklist

- [ ] Create a candidate with valid credentials (min 6 char password)
- [ ] Try to login with correct phone and password
- [ ] Try to login with incorrect credentials (should fail)
- [ ] Verify dashboard displays candidate info correctly
- [ ] Verify jobs table shows all applied jobs
- [ ] Test empty state when no jobs applied
- [ ] Test logout functionality
- [ ] Verify protected routes redirect unauthorized users
- [ ] Test hide/show password toggle
- [ ] Test mobile responsiveness

## Routes Summary

| Path | Component | Access | Purpose |
|------|-----------|--------|---------|
| `/login-candidate` | LoginCandidate | Public | Candidate login form |
| `/candidate-dashboard` | CandidateDashboard | Candidate only | Candidate's profile & jobs |
| `/login` | LoginUser | Public | User login (link to candidate) |
| `/login-admin` | LoginAdmin | Public | Admin login (link to candidate) |

## Database Schema

No database changes required! The system uses existing fields:
- `Candidate.phone` - For login identification
- `Candidate.password` - For authentication (added in previous update)
- `CandidateJob` - For displaying applied jobs

## Usage Instructions

### For Candidates
1. Navigate to `/login-candidate` or click "Candidate? Login here" from login pages
2. Enter your registered mobile number
3. Enter your password (created during registration)
4. Click "Login"
5. View your dashboard with personal info and applied jobs

### For Developers
1. Backend should be running on port 5000
2. Frontend should be running (Vite dev server)
3. Candidates must be created first through the user/admin system
4. Ensure candidate has a valid password (min 6 characters)

## Next Steps / Future Enhancements

1. **Password Security**: Hash passwords in database
2. **Password Reset**: Add forgot password functionality
3. **Profile Editing**: Allow candidates to update their info
4. **Job Application**: Let candidates apply for new jobs
5. **Resume Downloads**: Add ability to download generated resumes
6. **Notifications**: Email alerts for job status updates
7. **Enhanced Job Details**: Show more job information
8. **Search & Filter**: Filter applied jobs by status/date

## Notes

- Candidates are identified by phone number (unique)
- JWT token includes candidate_id for fetching profile
- Role "candidate" is distinct from "user" and "admin"
- The system maintains separation between user-created candidates and candidate self-service
- All existing functionality (user/admin dashboards) remains unchanged

