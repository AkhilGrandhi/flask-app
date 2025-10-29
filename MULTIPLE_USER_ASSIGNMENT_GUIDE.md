# Multiple User Assignment Feature - Implementation Guide

## Overview
This guide explains the changes made to enable assigning multiple users to a single candidate. When a candidate is assigned to users A, B, and C, all three users will be able to see and manage that candidate.

## Changes Made

### 1. Backend Changes

#### Database Model (`backend/app/models.py`)
- **Added**: `candidate_users` association table for many-to-many relationship between Candidates and Users
- **Added**: `assigned_candidates` relationship to User model
- **Added**: `assigned_users` backref to Candidate model (accessible via `candidate.assigned_users`)
- **Modified**: `Candidate.to_dict()` method now includes `assigned_users` array when `include_creator=True`

#### API Endpoints

**`backend/app/candidates.py`**
- **Modified**: `list_my_candidates()` - Now returns candidates where user is either creator OR assigned user
- **Modified**: `create_candidate()` - Now handles `assigned_user_ids` array to assign multiple users
- **Modified**: `update_candidate()` - Now handles `assigned_user_ids` array updates
- **Modified**: `owns_or_404()` - Now checks if user is creator OR in assigned_users list

**`backend/app/admin.py`**
- **Modified**: `admin_update_candidate()` - Now handles `assigned_user_ids` array for admin updates

### 2. Frontend Changes

#### Admin Dashboard (`frontend/src/pages/Admin.jsx`)
- **Modified**: "Assign User (Creator)" field changed to multi-select Autocomplete
- **Modified**: Table column "Creator" renamed to "Assigned Users"
- **Modified**: Displays all assigned users as badges in the candidates table
- **Modified**: Filter now searches through all assigned users (by name or email)
- **Modified**: When editing, loads all assigned users from the `assigned_users` array

### 3. Database Migration

**File Created**: `backend/migrations/versions/add_candidate_users_table.py`
- Creates the `candidate_users` association table with columns:
  - `candidate_id` (Foreign Key to candidate.id)
  - `user_id` (Foreign Key to user.id)
  - `created_at` (DateTime)
  - Primary Key: (candidate_id, user_id)

## Steps to Deploy

### Step 1: Update the Migration File
1. Open `backend/migrations/versions/add_candidate_users_table.py`
2. Find the line: `down_revision = None  # Update this to the latest migration ID in your system`
3. Check your latest migration ID by looking at other files in `backend/migrations/versions/`
4. Update `down_revision` to match your latest migration ID (e.g., `'df629fdccf7e'`)

### Step 2: Run the Database Migration
```bash
# Navigate to backend directory
cd backend

# Activate your virtual environment if needed
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run the migration
flask db upgrade

# Or if you're using the run_migrations.py script:
python run_migrations.py
```

### Step 3: Verify the Migration
Check that the `candidate_users` table was created:
```bash
# If using SQLite (local development)
sqlite3 instance/app.db ".schema candidate_users"

# Or connect to your database and run:
# SELECT * FROM candidate_users LIMIT 1;
```

### Step 4: Restart the Backend Server
```bash
# Stop the current server (Ctrl+C)
# Restart it
python wsgi.py
# Or if using Flask directly:
flask run
```

### Step 5: Test the Feature

1. **Login as Admin**
2. **Create a New Candidate**:
   - Click "Add Candidate" in the Candidates tab
   - In the "Assign Users" field, select multiple users (e.g., User A, User B, User C)
   - Fill in all required fields
   - Click "Create Candidate"
3. **Verify in Admin Dashboard**:
   - The candidates table should show all assigned users as badges
4. **Test User Access**:
   - Logout as admin
   - Login as User A - should see the candidate
   - Logout and login as User B - should see the candidate
   - Logout and login as User C - should see the candidate
5. **Test Filtering**:
   - In admin dashboard, use the "Assigned User" filter
   - Type any assigned user's name or email
   - Candidate should appear in filtered results

## How It Works

### Data Flow - Creating a Candidate
1. Admin selects multiple users in the Autocomplete dropdown
2. Frontend sends `assigned_user_ids: [1, 2, 3]` in the POST request
3. Backend creates the candidate with the first user as `created_by_user_id`
4. Backend adds entries to `candidate_users` table for each assigned user
5. SQLAlchemy automatically manages the many-to-many relationship

### Data Flow - Viewing Candidates
1. User logs in and requests their candidates list
2. Backend queries:
   - Candidates where `created_by_user_id = current_user.id` (created by user)
   - Candidates in `user.assigned_candidates` (assigned to user via join table)
3. Backend combines both lists and returns unique candidates
4. User sees all candidates they have access to

### Data Flow - Editing a Candidate
1. Admin clicks "Edit" on a candidate
2. Frontend loads `candidate.assigned_users` array
3. Autocomplete pre-selects all assigned users
4. Admin can add/remove users
5. Backend clears old assignments and creates new ones

## API Changes

### Request Format (Create/Update Candidate)
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "created_by_user_id": 1,
  "assigned_user_ids": [1, 2, 3],
  // ... other fields
}
```

### Response Format (Get Candidates)
```json
{
  "candidates": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "created_by": {
        "id": 1,
        "email": "admin@example.com",
        "name": "Admin User"
      },
      "assigned_users": [
        {
          "id": 1,
          "email": "user1@example.com",
          "name": "User One"
        },
        {
          "id": 2,
          "email": "user2@example.com",
          "name": "User Two"
        },
        {
          "id": 3,
          "email": "user3@example.com",
          "name": "User Three"
        }
      ],
      // ... other fields
    }
  ]
}
```

## Rollback Instructions

If you need to rollback this change:

```bash
# Downgrade the migration
flask db downgrade

# Or manually drop the table
sqlite3 instance/app.db "DROP TABLE candidate_users;"
```

Then revert the code changes using git:
```bash
git checkout HEAD~1 backend/app/models.py
git checkout HEAD~1 backend/app/candidates.py
git checkout HEAD~1 backend/app/admin.py
git checkout HEAD~1 frontend/src/pages/Admin.jsx
rm backend/migrations/versions/add_candidate_users_table.py
```

## Troubleshooting

### Issue: Migration fails with "table already exists"
**Solution**: The table might already exist from a previous attempt. Drop it first:
```bash
sqlite3 instance/app.db "DROP TABLE IF EXISTS candidate_users;"
flask db upgrade
```

### Issue: Users don't see assigned candidates
**Solution**: Check that entries exist in the `candidate_users` table:
```bash
sqlite3 instance/app.db "SELECT * FROM candidate_users;"
```

### Issue: "assigned_users" is empty in frontend
**Solution**: Ensure that:
1. The backend is returning `include_creator=True` in the API response
2. The migration was run successfully
3. Users were actually assigned when the candidate was created

## Security Notes

- Only admins can assign multiple users to candidates
- Regular users can only see candidates they created or are assigned to
- The `owns_or_404()` function now checks both creator and assigned users
- Candidates cannot see or modify user assignments

## Performance Considerations

- The `candidate_users` table uses composite primary key for efficiency
- Indexes are automatically created on foreign key columns
- The many-to-many relationship uses lazy loading to avoid N+1 queries
- Consider adding pagination if you have thousands of candidates

## Next Steps (Optional Enhancements)

1. **Audit Trail**: Track when users were assigned/unassigned
2. **Permissions**: Add different permission levels for assigned users
3. **Notifications**: Notify users when they're assigned to a candidate
4. **Bulk Assignment**: Add ability to assign multiple candidates to multiple users at once
5. **Assignment History**: Show history of user assignments over time

