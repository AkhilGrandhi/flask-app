# PostgreSQL Local Setup Guide (Windows)

This guide helps you set up PostgreSQL locally to test your application before deploying to Render.

**Note:** This is OPTIONAL - you can continue using SQLite locally and only use PostgreSQL on Render.

---

## Step 1: Install PostgreSQL on Windows

### Download and Install

1. **Download PostgreSQL**:
   - Go to: https://www.postgresql.org/download/windows/
   - Download the latest version (PostgreSQL 15 or 16)
   - Run the installer (postgresql-15.x-windows-x64.exe)

2. **During Installation**:
   - **Port**: Use default `5432`
   - **Password**: Set a password for the `postgres` superuser (remember this!)
   - **Locale**: Use default
   - **Components**: Install all (PostgreSQL Server, pgAdmin 4, Command Line Tools)

3. **Complete Installation**

---

## Step 2: Create Database

### Using pgAdmin (GUI Method)

1. **Open pgAdmin 4** (installed with PostgreSQL)
2. **Connect to server**:
   - Password: (the one you set during installation)
3. **Create Database**:
   - Right-click "Databases" → "Create" → "Database"
   - Name: `flask_app_db`
   - Owner: `postgres`
   - Click "Save"

### Using Command Line (Alternative)

```bash
# Open Command Prompt or PowerShell
psql -U postgres

# Enter password when prompted

# Create database
CREATE DATABASE flask_app_db;

# Exit
\q
```

---

## Step 3: Update Your Local Environment

### Create `.env` File (if not exists)

In your `backend` folder, create or update `.env`:

```env
# PostgreSQL Local Connection
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/flask_app_db

# Other environment variables
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Passw0rd!
ADMIN_MOBILE=9999999999
ADMIN_NAME=Administrator
```

**Replace:**
- `YOUR_PASSWORD` with the password you set during PostgreSQL installation

---

## Step 4: Install PostgreSQL Adapter (Already Done!)

Your `requirements.txt` already includes `psycopg2==2.9.3`, which is the PostgreSQL adapter for Python.

If you get installation errors with `psycopg2`, use the binary version:

```bash
pip uninstall psycopg2
pip install psycopg2-binary
```

---

## Step 5: Run Database Migrations

```bash
cd backend

# Activate virtual environment (if using one)
# venv\Scripts\activate  (Windows)

# Initialize migrations (if not already done)
flask db init

# Create migration
flask db migrate -m "Initial migration"

# Apply migration to PostgreSQL
flask db upgrade
```

This will:
- Create all tables in PostgreSQL
- Create the default admin user

---

## Step 6: Test Your Application

```bash
# Start Flask backend
python wsgi.py

# Or with Flask CLI
flask run
```

Your app should now connect to PostgreSQL instead of SQLite!

---

## Step 7: Verify Connection

### Check Database Connection

```bash
# In backend directory
python -c "from app import create_app; app = create_app(); print('Database URI:', app.config['SQLALCHEMY_DATABASE_URI'])"
```

Should output:
```
Database URI: postgresql://postgres:***@localhost:5432/flask_app_db
```

### Check Tables

```bash
psql -U postgres -d flask_app_db

# List tables
\dt

# Should show:
# - alembic_version
# - user
# - candidate
# - candidate_job

# Exit
\q
```

---

## Switching Between SQLite and PostgreSQL

### Use SQLite (Local Development)
Comment out or remove `DATABASE_URL` from `.env`:

```env
# DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/flask_app_db
```

### Use PostgreSQL (Testing Production Setup)
Uncomment `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/flask_app_db
```

---

## Common Issues and Solutions

### Issue 1: "psycopg2 installation failed"

**Solution**: Install binary version
```bash
pip uninstall psycopg2
pip install psycopg2-binary
```

Then update `requirements.txt`:
```
psycopg2-binary==2.9.3
```

---

### Issue 2: "FATAL: password authentication failed"

**Solution**: Check your password in `.env` matches PostgreSQL password

---

### Issue 3: "could not connect to server"

**Solution**: Ensure PostgreSQL service is running
- Windows: Open "Services" → Find "postgresql-x64-15" → Start if stopped

---

### Issue 4: "database does not exist"

**Solution**: Create the database
```bash
psql -U postgres
CREATE DATABASE flask_app_db;
\q
```

---

## Migrating Existing SQLite Data to PostgreSQL

If you have data in SQLite that you want to move to PostgreSQL:

### Method 1: Using Flask Shell (Recommended)

```python
# 1. Export data from SQLite
# Keep your .env using SQLite (no DATABASE_URL set)
python
>>> from app import create_app
>>> from app.models import db, User, Candidate, CandidateJob
>>> import json
>>> 
>>> app = create_app()
>>> with app.app_context():
...     users = User.query.all()
...     candidates = Candidate.query.all()
...     jobs = CandidateJob.query.all()
...     
...     # Save to JSON
...     data = {
...         'users': [u.to_dict() for u in users],
...         'candidates': [c.to_dict() for c in candidates],
...         # Add jobs if needed
...     }
...     
...     with open('backup.json', 'w') as f:
...         json.dump(data, f)
>>> exit()

# 2. Switch to PostgreSQL
# Update .env to use DATABASE_URL

# 3. Run migrations
flask db upgrade

# 4. Import data to PostgreSQL
python
>>> from app import create_app
>>> from app.models import db, User, Candidate
>>> from werkzeug.security import generate_password_hash
>>> import json
>>> 
>>> app = create_app()
>>> with app.app_context():
...     with open('backup.json', 'r') as f:
...         data = json.load(f)
...     
...     for u_data in data['users']:
...         # Recreate users (passwords need to be rehashed)
...         # Adjust as needed based on your data
...     
...     for c_data in data['candidates']:
...         # Recreate candidates
...         # Adjust as needed based on your data
>>> exit()
```

### Method 2: Using pgloader (Advanced)

Install pgloader and run:
```bash
pgloader sqlite://instance/app.db postgresql://postgres:PASSWORD@localhost/flask_app_db
```

---

## Uninstalling PostgreSQL (If Needed)

1. Windows Settings → Apps → PostgreSQL 15 → Uninstall
2. Delete data directory: `C:\Program Files\PostgreSQL\15\data`
3. Remove environment variables (if added to PATH)

---

## Summary: Do You Need PostgreSQL Locally?

### ✅ **No** - You can continue using SQLite locally
- Faster development
- No installation needed
- Simpler setup
- Deploy with PostgreSQL on Render

### ⚠️ **Yes** - Only if you want to:
- Test production database setup locally
- Debug PostgreSQL-specific issues
- Ensure compatibility before deployment
- Work with large datasets

---

## Recommendation

**For most developers:**
- **Local Development**: Keep using SQLite (no setup needed)
- **Production (Render)**: Use PostgreSQL (managed by Render)

**Only install PostgreSQL locally if:**
- You're experiencing database-specific issues
- You want to test exact production setup
- You're working with team members who use PostgreSQL

---

## Next Steps

1. **If continuing with SQLite locally**: No action needed, just deploy to Render with PostgreSQL
2. **If installing PostgreSQL locally**: Follow steps 1-6 above
3. **For deployment**: Follow the main `RENDER_DEPLOYMENT_GUIDE.md`

---

**Document Version**: 1.0  
**Last Updated**: October 22, 2025  
**Platform**: Windows 10/11


