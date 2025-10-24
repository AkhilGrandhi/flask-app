# Quick Start: Candidate Login System

## 🚀 What We Built

A complete candidate authentication and dashboard system where candidates can:
- ✅ Log in using their mobile number and password
- ✅ View their basic information (Name, Email, Phone)
- ✅ See all jobs they've applied for in a clean table

## 📋 Prerequisites

Before candidates can log in, they must be **registered through the user system**:
1. A user (or admin) must create a candidate profile
2. The candidate profile must include:
   - Phone number (unique)
   - Password (minimum 6 characters)
   - Other required information

## 🔑 How to Use

### Step 1: Access the Login Page
Navigate to: **`http://localhost:5173/login-candidate`**

Or click "Candidate? Login here" from the User or Admin login pages.

### Step 2: Enter Credentials
- **Phone Number**: The mobile number used during registration
- **Password**: The password set during registration (min 6 characters)

### Step 3: View Dashboard
After successful login, you'll see:
1. **Welcome header** with your name
2. **Basic Information Cards**:
   - Full Name
   - Email Address
   - Mobile Number
3. **Jobs Applied Table**:
   - Job ID
   - Job Description
   - Resume Status (Generated/Pending)
   - Application Date

## 🎯 Testing the System

### Create a Test Candidate
1. Log in as a **User** or **Admin**
2. Go to the dashboard
3. Click "Add Candidate"
4. Fill in all required fields including:
   - Phone: e.g., `9876543210`
   - Password: e.g., `test123` (min 6 chars)
5. Submit the form

### Login as the Candidate
1. Go to `/login-candidate`
2. Enter phone: `9876543210`
3. Enter password: `test123`
4. Click "Login"
5. You should see the candidate dashboard!

## 🛠️ Routes

| URL | Purpose |
|-----|---------|
| `/login-candidate` | Candidate login page |
| `/candidate-dashboard` | Candidate's personal dashboard (protected) |
| `/login` | Regular user login (has link to candidate login) |
| `/login-admin` | Admin login (has link to candidate login) |

## 🔐 Authentication Details

- **Login Method**: Phone Number + Password
- **Session Type**: JWT token in HTTP-only cookie
- **Role**: "candidate" (separate from "user" and "admin")
- **Token Expiry**: Based on your JWT configuration

## 📊 Dashboard Features

### Basic Information Section
Three cards displaying:
1. **Name**: First Name + Last Name
2. **Email**: Registered email address
3. **Phone**: Mobile number used for login

### Jobs Applied Section
A table showing:
- **Job ID**: Unique identifier for the job
- **Job Description**: Full or truncated description
- **Resume Status**: 
  - ✓ Generated (green) - Resume has been created
  - Pending (gray) - No resume yet
- **Applied Date**: When the application was submitted

If no jobs have been applied yet, shows a friendly message.

## 🎨 UI/UX Features

### Login Page
- ✅ Clean Material-UI design
- ✅ Password show/hide toggle
- ✅ Client-side validation
- ✅ Clear error messages
- ✅ Links to other login types
- ✅ Mobile responsive

### Dashboard
- ✅ Professional card layout
- ✅ Color-coded status indicators
- ✅ Responsive data table
- ✅ Empty state handling
- ✅ Logout button in header
- ✅ Avatar with initials

## ⚙️ Backend Endpoints

### Authentication
```
POST /api/auth/login-candidate
Body: { phone: "1234567890", password: "password123" }
Response: Sets JWT cookie, returns { message, role: "candidate" }
```

### Get Profile
```
GET /api/candidates/me
Headers: JWT token (automatic from cookie)
Response: {
  id, first_name, last_name, email, phone,
  jobs: [{ id, job_id, job_description, resume_content, created_at }],
  ...other candidate fields
}
```

## 🔍 Troubleshooting

### "Invalid phone number or password"
- ✓ Check the phone number is correct (digits only)
- ✓ Verify the password matches what was set during registration
- ✓ Make sure the candidate was created with a password

### Dashboard shows "Loading..." indefinitely
- ✓ Check backend is running
- ✓ Check browser console for errors
- ✓ Verify JWT token is present in cookies
- ✓ Check network tab for API call failures

### Can't access dashboard (redirected to login)
- ✓ Make sure you're logged in as a candidate
- ✓ Check JWT token hasn't expired
- ✓ Verify role is "candidate" not "user" or "admin"

### No jobs showing in the table
- This is normal if the candidate hasn't applied to any jobs yet
- Jobs are added when users/admins create job applications for the candidate
- The table will update automatically once jobs are added

## 🚦 Status Indicators

In the Jobs Applied table:
- **✓ Generated** (Green): Resume has been successfully created
- **Pending** (Gray): Resume generation is pending or not started

## 📱 Mobile Responsive

The system is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers
- 🖥️ Large screens

## 🔗 Navigation

From the candidate dashboard, you can:
- **Logout**: Click the "Logout" button in the header
  - Returns to the candidate login page
  - Clears authentication token

## 💡 Tips

1. **Remember your phone number**: This is your username
2. **Keep password secure**: Minimum 6 characters required
3. **Check regularly**: New jobs may appear as they're added
4. **Note resume status**: Check if your resumes are generated

## 📝 Next Features (Potential Enhancements)

- 🔄 Password reset functionality
- ✏️ Edit profile information
- 📄 Download generated resumes
- 🔔 Email notifications for new jobs
- 🔍 Search and filter jobs
- 📊 Application statistics

## ✅ Complete Feature List

- [x] Candidate login with phone + password
- [x] Password show/hide toggle
- [x] JWT authentication
- [x] Protected routes
- [x] Dashboard with basic info
- [x] Jobs applied table
- [x] Resume status indicators
- [x] Logout functionality
- [x] Mobile responsive design
- [x] Error handling
- [x] Loading states
- [x] Empty states

---

**Ready to test!** 🎉

Start by creating a candidate through the user/admin interface, then log in using the candidate login page.

