# SQLite to PostgreSQL Migration Guide

## Quick Answer: What Changes Are Needed?

### ✅ **For Deploying to Render: ZERO Code Changes!**

Your code already supports both SQLite and PostgreSQL. Here's what happens:

```python
# backend/config.py (NO CHANGES NEEDED)
SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
```

**This line does all the magic:**
- **Locally** (no `DATABASE_URL`): Uses SQLite ✅
- **On Render** (with `DATABASE_URL`): Uses PostgreSQL ✅

---

## 🎯 **Recommended Approach**

### **Option 1: Hybrid (Best Practice)** ⭐

**Local Development**: SQLite (current setup)
**Production (Render)**: PostgreSQL (automatic)

**Changes Required:**
- ✅ **Code**: None - already compatible!
- ✅ **Local Setup**: None - keep using SQLite
- ✅ **On Render**: Just create PostgreSQL database (per deployment guide)

**Why This is Best:**
- 🚀 Fast local development (no PostgreSQL installation)
- 🔒 Production-ready database on Render
- 🎨 Simple workflow
- 💰 No local PostgreSQL costs

---

## 📊 **Comparison: What Changes For Each Scenario**

| Task | Keep SQLite | Switch to PostgreSQL Locally | Deploy to Render |
|------|-------------|------------------------------|------------------|
| **Code Changes** | None | None | None |
| **Install Database** | Already done | Download & install PostgreSQL | Render manages it |
| **Configuration** | None | Add DATABASE_URL to .env | Set in Render dashboard |
| **Migrations** | Already done | Run `flask db upgrade` | Run via Render Shell |
| **Complexity** | ⭐ Easy | ⭐⭐⭐ Medium | ⭐⭐ Easy |

---

## 🔍 **Detailed: What Needs to Change**

### **1. Code Changes: NONE!** ✅

Your code is already ready. Let's verify:

#### ✅ `backend/config.py` - Already Compatible
```python
# Current code - NO CHANGES NEEDED
SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
```

#### ✅ `backend/requirements.txt` - Already Includes PostgreSQL Driver
```
psycopg2==2.9.3  # PostgreSQL adapter - already there!
```

#### ✅ `backend/app/models.py` - SQLAlchemy is Database-Agnostic
Your models work with both SQLite and PostgreSQL - no changes needed!

#### ✅ All Blueprint Files - No Changes Needed
- `auth.py`, `candidates.py`, `admin.py`, `ai.py` - all compatible!

---

### **2. Local Development Changes**

#### **Option A: Keep SQLite** ⭐ (Recommended)

**Changes Needed:** **ZERO**

Just continue as you are:
```bash
cd backend
python wsgi.py
```

Your app will use `instance/app.db` as it currently does.

---

#### **Option B: Switch to PostgreSQL Locally** (Optional)

**Only if you want to test PostgreSQL before deployment:**

**Step 1: Install PostgreSQL**
- Download from: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for `postgres` user

**Step 2: Create Database**
```bash
psql -U postgres
CREATE DATABASE flask_app_db;
\q
```

**Step 3: Add to `.env`**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/flask_app_db
```

**Step 4: Run Migrations**
```bash
flask db upgrade
```

**That's it!** No code changes.

---

### **3. Deployment to Render Changes**

**Changes Required:** **Configuration Only, No Code!**

#### Step 1: Create PostgreSQL on Render
- Dashboard → New → PostgreSQL
- Name: `flask-app-database`
- Render automatically provides `DATABASE_URL`

#### Step 2: Link to Your Backend
- Render sets `DATABASE_URL` environment variable automatically
- Your app switches to PostgreSQL automatically!

#### Step 3: Run Migrations
```bash
# In Render Shell
flask db upgrade
```

**No code changes needed!**

---

## 📝 **Migration Checklist**

### For Render Deployment (Recommended)

- [ ] **Local Development**
  - [x] Keep using SQLite (no changes)
  - [x] Code already supports both databases

- [ ] **Push Code to Git**
  - [ ] Commit all changes
  - [ ] Push to GitHub/GitLab

- [ ] **On Render**
  - [ ] Create PostgreSQL database (see deployment guide)
  - [ ] Create backend web service
  - [ ] Set environment variables (DATABASE_URL auto-set)
  - [ ] Run migrations: `flask db upgrade`
  - [ ] Deploy!

- [ ] **Verify**
  - [ ] Check health endpoint
  - [ ] Test admin login
  - [ ] Create a test candidate

---

### For Local PostgreSQL (Optional)

- [ ] **Installation**
  - [ ] Download PostgreSQL
  - [ ] Install (remember postgres password)
  - [ ] Verify installation: `psql --version`

- [ ] **Database Setup**
  - [ ] Create database: `flask_app_db`
  - [ ] Verify: `psql -U postgres -l`

- [ ] **Application Configuration**
  - [ ] Add `DATABASE_URL` to `.env`
  - [ ] Test connection
  - [ ] Run migrations: `flask db upgrade`

- [ ] **Verify**
  - [ ] Start app: `python wsgi.py`
  - [ ] Check database URI in logs
  - [ ] Test functionality

---

## 🔧 **File Changes Summary**

### Files You DON'T Need to Change:
- ✅ `backend/config.py` - Already compatible
- ✅ `backend/wsgi.py` - No changes needed
- ✅ `backend/app/__init__.py` - Works with both
- ✅ `backend/app/models.py` - Database-agnostic
- ✅ All blueprint files - No changes needed
- ✅ Frontend files - No changes needed

### Files You MIGHT Need to Change (Optional):
- ⚠️ `backend/requirements.txt` - Only if `psycopg2` installation fails:
  ```
  # Change this:
  psycopg2==2.9.3
  
  # To this (binary version):
  psycopg2-binary==2.9.3
  ```

### Files You NEED to Create (Only for Local PostgreSQL):
- ⚠️ `backend/.env` - If testing PostgreSQL locally:
  ```env
  DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/flask_app_db
  ```

---

## ⚡ **Quick Commands Reference**

### Check Current Database
```bash
cd backend
python -c "from app import create_app; app = create_app(); print(app.config['SQLALCHEMY_DATABASE_URI'])"
```

**Output if using SQLite:**
```
sqlite:////path/to/instance/app.db
```

**Output if using PostgreSQL:**
```
postgresql://user:password@host:5432/database
```

---

### Switch Between Databases Locally

**Use SQLite:**
```bash
# Remove or comment out DATABASE_URL in .env
# DATABASE_URL=postgresql://...
```

**Use PostgreSQL:**
```bash
# Add or uncomment DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/flask_app_db
```

---

### Test Database Connection

**SQLite:**
```bash
python -c "from app import create_app; from app.models import db, User; app = create_app(); with app.app_context(): print('Users:', User.query.count())"
```

**PostgreSQL:**
```bash
psql -U postgres -d flask_app_db -c "SELECT COUNT(*) FROM \"user\";"
```

---

## 🚨 **Common Mistakes to Avoid**

### ❌ Don't: Manually edit database connection strings in code
```python
# DON'T DO THIS:
SQLALCHEMY_DATABASE_URI = "postgresql://..."  # Hardcoded!
```

### ✅ Do: Use environment variables
```python
# DO THIS:
SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
```

---

### ❌ Don't: Install PostgreSQL if you don't need it locally
**You DON'T need PostgreSQL on your local machine to deploy to Render!**

### ✅ Do: Keep SQLite locally, use PostgreSQL on Render
**This is the best practice for most developers.**

---

### ❌ Don't: Forget to run migrations on Render
After deploying to Render, you must run:
```bash
flask db upgrade
```

### ✅ Do: Run migrations as part of deployment
Add to Build Command or run manually via Render Shell.

---

## 🎓 **Understanding the Differences**

### SQLite
- **Type**: File-based database
- **Location**: `instance/app.db` (single file)
- **Pros**: Simple, fast for dev, no installation
- **Cons**: One writer at a time, not scalable
- **Best For**: Local development, small apps

### PostgreSQL
- **Type**: Client-server database
- **Location**: Separate database server
- **Pros**: Multiple users, scalable, production-ready
- **Cons**: Requires installation/setup
- **Best For**: Production, multi-user apps

### Your App Supports BOTH!
- Uses SQLAlchemy ORM (database-agnostic)
- Switches automatically based on `DATABASE_URL`
- No code changes needed to switch!

---

## 📱 **For Your Specific Situation**

Based on your question: "I didn't install any software in my machine"

### **What You Should Do:**

1. ✅ **Keep using SQLite locally** (no PostgreSQL installation needed)
2. ✅ **Deploy to Render with PostgreSQL** (Render manages it)
3. ✅ **No code changes required** (already compatible!)

### **What You Should NOT Do:**

1. ❌ Don't install PostgreSQL locally (unless you want to test)
2. ❌ Don't change any code (already works!)
3. ❌ Don't worry about manual migration (it's automatic!)

---

## ✅ **Final Answer to Your Question**

### "What changes do I need to move from SQLite to PostgreSQL?"

**For deploying to Render:**
- **Code Changes**: 0 (zero)
- **Local Installation**: Not required
- **Configuration Changes**: Set environment variables on Render (done via dashboard)
- **Database Setup**: Create PostgreSQL on Render (few clicks)
- **Migration**: Run `flask db upgrade` on Render (one command)

**Your app is already PostgreSQL-ready!** 🎉

---

## 📚 **Additional Resources**

- **Full setup guide**: See `POSTGRESQL_LOCAL_SETUP_GUIDE.md` (if you want to test locally)
- **Deployment guide**: See `RENDER_DEPLOYMENT_GUIDE.md` (for production deployment)
- **SQLAlchemy docs**: https://docs.sqlalchemy.org/
- **PostgreSQL docs**: https://www.postgresql.org/docs/

---

**Quick Summary:**
- ✅ Your code already supports PostgreSQL
- ✅ No changes needed for Render deployment
- ✅ No need to install PostgreSQL locally
- ✅ Just create PostgreSQL on Render and deploy!

**Next Step:** Follow the `RENDER_DEPLOYMENT_GUIDE.md` to deploy your app! 🚀


