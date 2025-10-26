# Deployment Fix Guide - Render

This guide will help you fix the current deployment issues on Render after adding the F1 Type field.

## 🔴 Issue

After the recent deployment, form submissions, user deletion, and candidate operations are failing because:

1. **New database column (`f1_type`) hasn't been migrated** on the production database
2. Backend tries to insert data into a column that doesn't exist
3. This causes all candidate-related operations to fail

## ✅ Solution Overview

We need to run the database migrations on your Render deployment to add the missing `f1_type` column.

---

## 🚀 Quick Fix (Recommended)

### Option 1: Automatic Migration on Deploy

**Step 1:** Update Render Build Command

1. Go to your **Backend service** on Render Dashboard
2. Click **"Settings"**
3. Scroll to **"Build & Deploy"**
4. Update **Build Command** to:
   ```bash
   chmod +x build.sh && ./build.sh
   ```
5. Click **"Save Changes"**
6. Click **"Manual Deploy"** → **"Deploy latest commit"**

This will automatically run migrations every time you deploy.

### Option 2: Manual Migration via Shell

**Step 1:** Access Render Shell

1. Go to your **Backend service** on Render Dashboard
2. Click the **"Shell"** tab (top right)
3. Wait for the shell to connect (30-60 seconds)

**Step 2:** Run Migration Script

```bash
# Navigate to backend directory (if needed)
cd /opt/render/project/src

# Run the migration runner
python run_migrations.py
```

You should see output like:
```
============================================================
Database Migration Runner
============================================================

1. Creating Flask application...
2. Checking database connection...
   Connected to: postgresql:***@...
3. Running migrations...
   Executing: flask db upgrade
   ✓ Migrations completed successfully!
4. Verifying database schema...
   Found 4 tables:
   - candidate: 45 columns
     ✓ f1_type column exists
   - user: 7 columns
   ...
============================================================
Migration completed successfully!
============================================================
```

**Step 3:** Verify Migration

```bash
# Check if f1_type column exists
python -c "from app import create_app; from app.models import db, Candidate; app = create_app(); app.app_context().push(); from sqlalchemy import inspect; inspector = inspect(db.engine); cols = [col['name'] for col in inspector.get_columns('candidate')]; print('f1_type exists!' if 'f1_type' in cols else 'ERROR: f1_type missing')"
```

Should output: `f1_type exists!`

---

## 🔍 Alternative: Manual Migration Commands

If the script doesn't work, run these commands manually in the Render Shell:

```bash
# Check current directory
pwd

# If not in the project root, navigate there
cd /opt/render/project/src

# Check database connection
python -c "from app import create_app; app = create_app(); print('Database:', app.config['SQLALCHEMY_DATABASE_URI'][:50])"

# Run migrations
flask db upgrade

# If migration fails, check migration history
flask db current

# Show pending migrations
flask db heads

# Apply specific migration (use the revision ID of the f1_type migration)
flask db upgrade e8f5a6b7c8d9
```

---

## 🧪 Testing After Migration

### Test 1: Check Backend Health

Open in browser:
```
https://your-backend.onrender.com/api/healthz
```

Should return: `{"status": "ok"}`

### Test 2: Login and Test Operations

1. **Login** to your frontend
2. **Try to create a candidate** - fill all fields
3. **Submit the form** - should work now
4. **Edit a candidate** - should work
5. **Delete a user** (as admin) - should work
6. **Add a job** to a candidate - should work

### Test 3: Test F1 Type Feature

1. Create or edit a candidate
2. Select **"F1"** from Visa Status dropdown
3. You should see **"F1 Type"** dropdown appear
4. Select either **"Post OPT"** or **"STEM OPT"**
5. Submit the form
6. Verify it saves correctly

---

## 🐛 Troubleshooting

### Issue 1: Migration Fails with "relation does not exist"

**Solution:** Manually create tables

```bash
# In Render Shell
python -c "from app import create_app; from app.models import db; app = create_app(); app.app_context().push(); db.create_all(); print('Tables created!')"

# Then run migrations
flask db upgrade
```

### Issue 2: "Column f1_type already exists"

**Solution:** Migration already ran successfully, just restart the service

```bash
# Mark migration as complete
flask db stamp head

# Restart service (exit shell, then click Manual Deploy)
```

### Issue 3: Permission Denied on build.sh

**Solution:** Make script executable

```bash
# In Render Shell
chmod +x build.sh
```

Then redeploy.

### Issue 4: Still Getting Errors After Migration

**Check Logs:**

1. Go to Render Dashboard → Backend Service
2. Click **"Logs"** tab
3. Look for specific error messages
4. Common errors:
   - `column "f1_type" does not exist` → Migration didn't run
   - `IntegrityError` → Data validation issue
   - `Unauthorized` → JWT/CORS issue

**Clear and Redeploy:**

```bash
# In Render Shell
python -c "from app import create_app; from app.models import db; app = create_app(); app.app_context().push(); from sqlalchemy import text; db.session.execute(text('ALTER TABLE candidate ADD COLUMN IF NOT EXISTS f1_type VARCHAR(120)')); db.session.commit(); print('Column added!')"
```

### Issue 5: Form Still Shows Error

**Clear Browser Cache:**

1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select **"Empty Cache and Hard Reload"**
4. Or try in Incognito/Private mode

---

## 📋 Post-Migration Checklist

After running migrations, verify these features work:

- [ ] Login (admin and user)
- [ ] Create user (admin only)
- [ ] Update user (admin only)
- [ ] Delete user (admin only)
- [ ] Create candidate
- [ ] Edit candidate
- [ ] Delete candidate
- [ ] View candidate details
- [ ] Add job to candidate
- [ ] Generate resume
- [ ] Download resume
- [ ] F1 Type dropdown shows when F1 selected
- [ ] F1 Type value saves correctly

---

## 🔄 Future Deployments

To prevent this issue in the future:

### 1. Always Run Migrations on Deploy

Your `backend/build.sh` now includes:
```bash
pip install -r requirements.txt
flask db upgrade
```

Make sure Render Build Command uses it:
```bash
chmod +x build.sh && ./build.sh
```

### 2. Test Locally First

Before deploying:
```bash
# Run migrations locally
cd backend
flask db upgrade

# Test all features
# Then push to GitHub
git push
```

### 3. Check Logs After Deploy

After each deployment:
1. Go to Render Dashboard → Logs
2. Verify you see: `"Running database migrations..."`
3. Verify you see: `"Build completed successfully!"`

---

## 📞 Need Help?

If you're still experiencing issues:

1. **Check Render Logs** for specific error messages
2. **Run the migration verification** script
3. **Test in Incognito mode** to rule out cache issues
4. **Check database** to confirm column exists:
   ```bash
   python -c "from sqlalchemy import create_engine, inspect; import os; engine = create_engine(os.getenv('DATABASE_URL')); inspector = inspect(engine); print([col['name'] for col in inspector.get_columns('candidate')])"
   ```

---

## ✅ Summary

The issue was caused by a missing database column (`f1_type`) that wasn't migrated after the recent code changes. Running the migration script or setting up automatic migrations on deploy will fix this.

**Quick Steps:**
1. Update Render Build Command to use `build.sh`
2. Or run `python run_migrations.py` in Render Shell
3. Verify migration succeeded
4. Test all features
5. You're done! 🎉

