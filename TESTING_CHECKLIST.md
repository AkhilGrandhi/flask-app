# Application Testing Checklist

Use this checklist to verify all functionalities are working correctly after deployment.

## 🔐 Authentication & Authorization

### Admin Login
- [ ] Can login with admin credentials at `/login-admin`
- [ ] Redirects to admin dashboard after successful login
- [ ] Shows error message for invalid credentials
- [ ] JWT token is set in cookies

### User Login
- [ ] Can login with mobile number at `/login-user`
- [ ] Redirects to user dashboard after successful login
- [ ] Shows error message for invalid credentials
- [ ] JWT token is set in cookies

### Candidate Login
- [ ] Can login with email/password at `/login-candidate`
- [ ] Redirects to candidate dashboard after successful login
- [ ] Shows error message for invalid credentials
- [ ] JWT token is set in cookies

### Logout
- [ ] Logout button works
- [ ] JWT token is cleared
- [ ] Redirects to login page
- [ ] Cannot access protected routes after logout

---

## 👥 User Management (Admin Only)

### Create User
- [ ] Click "Add User" button
- [ ] Form opens with all fields
- [ ] Required fields are validated
- [ ] Email validation works (must contain @)
- [ ] Mobile validation works (only digits)
- [ ] Password validation works (minimum 6 characters)
- [ ] Duplicate email shows error
- [ ] Duplicate mobile shows error
- [ ] Success message appears after creation
- [ ] New user appears in user list
- [ ] Can login with new user credentials

### Edit User
- [ ] Click edit icon on user row
- [ ] Form pre-fills with existing data
- [ ] Can update name
- [ ] Can update email
- [ ] Can update mobile
- [ ] Can change password
- [ ] Can change role (user/admin)
- [ ] Password field can be left blank (keeps existing)
- [ ] Validation works on update
- [ ] Success message appears
- [ ] Changes reflect in user list

### Delete User
- [ ] Click delete icon on user row
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] User is deleted after confirmation
- [ ] User disappears from list
- [ ] Cannot login with deleted user

---

## 👤 Candidate Management

### Create Candidate (User)
- [ ] Click "Add Candidate" button
- [ ] Form opens with all sections:
  - Personal Information
  - Address Information
  - Online Presence
  - Additional Details
- [ ] All required fields are marked
- [ ] Dropdown fields show options
- [ ] Date picker works for birthdate
- [ ] **Visa Status dropdown shows all options:**
  - None
  - F1
  - Citizen
  - Green card (GC)
  - GC-EAD
  - H1B
  - H4
  - L1
  - J1
  - Other
- [ ] **When "F1" is selected:**
  - [ ] F1 Type dropdown appears
  - [ ] Shows "Post OPT" and "STEM OPT" options
  - [ ] Can select an option
- [ ] **When any other visa status is selected:**
  - [ ] F1 Type dropdown is hidden
  - [ ] F1 Type value is cleared
- [ ] **Visa Status validation:**
  - [ ] Cannot submit with "None" selected
  - [ ] Error message appears: "Please select a valid visa status"
  - [ ] Error disappears when valid option selected
- [ ] Email validation works
- [ ] Phone validation works (only digits)
- [ ] Postal code validation works (only digits)
- [ ] Password validation works (minimum 6 characters)
- [ ] Duplicate email shows error
- [ ] Duplicate phone shows error
- [ ] Success message appears after creation
- [ ] Candidate appears in candidate list

### Edit Candidate (User)
- [ ] Click candidate card
- [ ] View page opens
- [ ] Click "Edit Candidate" button
- [ ] Form pre-fills with existing data
- [ ] Can update all fields
- [ ] **F1 Type dropdown appears if visa status is "F1"**
- [ ] **F1 Type value is preserved on edit**
- [ ] **Changing visa status from "F1" clears F1 Type**
- [ ] Password field can be left blank
- [ ] Validation works on update
- [ ] Success message appears
- [ ] Changes reflect in candidate details

### Delete Candidate (User)
- [ ] Click "Delete Candidate" button
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Candidate is deleted after confirmation
- [ ] Redirects to dashboard
- [ ] Candidate disappears from list

### View Candidate Details
- [ ] Click candidate card
- [ ] Details page shows all information
- [ ] Personal info displayed correctly
- [ ] **F1 Type displays if visa status is "F1"**
- [ ] Address info displayed correctly
- [ ] Online presence links work
- [ ] Technical skills, work experience, education, certificates shown
- [ ] Jobs section displays added jobs
- [ ] Can download resume for each job

---

## 👨‍💼 Admin Candidate Management

### View All Candidates (Admin)
- [ ] Admin can see all candidates from all users
- [ ] Creator name/email shown for each candidate
- [ ] Can filter/search candidates
- [ ] Statistics cards show correct counts

### Edit Any Candidate (Admin)
- [ ] Can edit candidates created by other users
- [ ] All fields are editable
- [ ] **F1 Type field works correctly**
- [ ] Validation works
- [ ] Changes save successfully

### Delete Any Candidate (Admin)
- [ ] Can delete candidates created by other users
- [ ] Confirmation dialog appears
- [ ] Deletion works correctly

---

## 📋 Job & Resume Management

### Add Job to Candidate
- [ ] Click "Add Job" on candidate details page
- [ ] Form appears with Job ID and Description fields
- [ ] Both fields are required
- [ ] Can paste job description
- [ ] Submit button works
- [ ] Loading indicator appears during processing
- [ ] Success message appears
- [ ] Resume generation completes (OpenAI API call)
- [ ] Resume downloads automatically
- [ ] Job appears in jobs list
- [ ] Can view job details

### Download Resume
- [ ] Click download icon on job row
- [ ] Resume downloads as .doc file
- [ ] Filename format: `FirstName_LastName_Resume_JobID.doc`
- [ ] File opens correctly in Word
- [ ] Contains candidate information
- [ ] Contains job description
- [ ] Contains tailored skills/experience

### View Job Details
- [ ] Click on job in jobs list
- [ ] Shows job ID
- [ ] Shows job description
- [ ] Shows resume content
- [ ] Shows creation date
- [ ] Can download from detail view

---

## 🌐 Form Validations

### Email Validation
- [ ] Must contain @ symbol
- [ ] Shows error for invalid format
- [ ] Error clears when corrected

### Phone Validation
- [ ] Must contain only digits
- [ ] Shows error for non-numeric input
- [ ] Error clears when corrected

### Password Validation
- [ ] Minimum 6 characters
- [ ] Shows error for short passwords
- [ ] Can toggle visibility (show/hide)
- [ ] Error clears when meets requirements

### Required Fields
- [ ] All required fields show * or (required)
- [ ] Shows error when submitting empty required fields
- [ ] Lists all missing fields in error message

### Duplicate Detection
- [ ] Email duplicate detection works
- [ ] Shows which candidate has duplicate email
- [ ] Phone duplicate detection works
- [ ] Shows which candidate has duplicate phone
- [ ] Works across all candidates for admin
- [ ] Works within user's candidates for regular users

### Visa Status Validation (**NEW**)
- [ ] Cannot select "None" and submit
- [ ] Error appears immediately on submit
- [ ] Error shown in field helper text
- [ ] Error shown in general error message
- [ ] Error clears when valid status selected

---

## 🎨 UI/UX Features

### Form Behavior
- [ ] Forms are responsive on mobile
- [ ] Dropdowns open correctly
- [ ] Date pickers work on all devices
- [ ] Text areas resize properly
- [ ] Buttons have proper states (disabled, loading)
- [ ] Error messages are visible and clear
- [ ] Success messages auto-dismiss or have close button

### Navigation
- [ ] Dashboard link works
- [ ] Logout link works
- [ ] Back buttons work
- [ ] Breadcrumbs work (if implemented)
- [ ] Browser back/forward buttons work

### Loading States
- [ ] Loading indicators show during API calls
- [ ] Buttons disable during submission
- [ ] Cannot double-submit forms
- [ ] Skeleton loaders or spinners appear appropriately

### Conditional Fields (**NEW**)
- [ ] **F1 Type dropdown appears smoothly**
- [ ] **No layout shift when F1 Type appears/disappears**
- [ ] **Other conditional fields work (Other → specify field)**

---

## 🔒 Security & Permissions

### User Permissions
- [ ] Regular users can only see their own candidates
- [ ] Cannot access admin routes
- [ ] Cannot edit/delete other users' candidates
- [ ] Get 403 error when trying to access admin features

### Admin Permissions
- [ ] Admin can access all routes
- [ ] Can view all users
- [ ] Can view all candidates
- [ ] Can edit/delete any data
- [ ] Can create users

### Session Management
- [ ] Session persists on page refresh
- [ ] Session expires after logout
- [ ] Cannot use old tokens after logout
- [ ] Expired tokens redirect to login

---

## 🌍 Cross-Browser Testing

Test on multiple browsers:

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Layout correct

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Layout correct

### Safari (if available)
- [ ] All features work
- [ ] No console errors
- [ ] Layout correct

### Edge
- [ ] All features work
- [ ] No console errors
- [ ] Layout correct

---

## 📱 Mobile Testing

### Responsive Design
- [ ] Forms are usable on mobile
- [ ] Buttons are tappable
- [ ] Text is readable
- [ ] No horizontal scroll
- [ ] Navigation works

### Mobile-Specific
- [ ] Date pickers use native mobile pickers
- [ ] Dropdowns work on mobile
- [ ] Virtual keyboard doesn't break layout
- [ ] Can zoom if needed

---

## ⚡ Performance

### Load Times
- [ ] Dashboard loads in < 3 seconds
- [ ] Form submissions complete in < 2 seconds
- [ ] Resume generation completes in < 15 seconds
- [ ] No noticeable lag when typing

### Data Handling
- [ ] Can handle 100+ candidates
- [ ] Pagination works (if implemented)
- [ ] Search is responsive
- [ ] Filters work correctly

---

## 🐛 Error Handling

### Network Errors
- [ ] Shows error message when backend is down
- [ ] Shows error for failed API calls
- [ ] Retry mechanism works (if implemented)

### Form Errors
- [ ] Shows validation errors clearly
- [ ] Multiple errors display correctly
- [ ] Error messages are helpful

### Backend Errors
- [ ] 400 errors show user-friendly messages
- [ ] 401 errors redirect to login
- [ ] 403 errors show permission denied
- [ ] 404 errors show not found
- [ ] 500 errors show generic error message

---

## 🎯 Edge Cases

### Empty States
- [ ] Empty candidate list shows appropriate message
- [ ] Empty job list shows appropriate message
- [ ] No users shows appropriate message (admin)

### Special Characters
- [ ] Names with special characters work (O'Brien, José)
- [ ] Addresses with special characters work
- [ ] Job descriptions with special characters work

### Long Text
- [ ] Long names don't break layout
- [ ] Long addresses display correctly
- [ ] Long job descriptions handled properly
- [ ] Text truncates with ellipsis where needed

### Numeric Limits
- [ ] Very long phone numbers handled
- [ ] Large postal codes handled
- [ ] Maximum field lengths enforced

---

## ✅ Sign-Off

**Tester Name:** ________________  
**Date:** ________________  
**Environment:** ________________ (Local / Staging / Production)  
**All Tests Passed:** ☐ Yes ☐ No  

**Notes/Issues Found:**
_______________________________________________
_______________________________________________
_______________________________________________

**Critical Issues (Must Fix):**
_______________________________________________
_______________________________________________

**Minor Issues (Nice to Fix):**
_______________________________________________
_______________________________________________

---

## 🚀 Deployment Verification

After deploying to production, verify these specifically:

- [ ] Database migrations ran successfully
- [ ] All environment variables are set
- [ ] CORS is configured correctly
- [ ] JWT cookies work cross-domain
- [ ] OpenAI API key is working
- [ ] File downloads work
- [ ] Email validation works
- [ ] **F1 Type field and validation work correctly**
- [ ] Logs show no errors
- [ ] Health check endpoint returns OK

---

**Last Updated:** 2025-10-26  
**Version:** 2.0 (includes F1 Type feature)

