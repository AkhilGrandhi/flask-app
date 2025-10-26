# Deployment Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Render)](#frontend-deployment-render)
5. [Database Setup (Render PostgreSQL)](#database-setup-render-postgresql)
6. [Chrome Extension Publishing](#chrome-extension-publishing)
7. [Environment Configuration](#environment-configuration)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## Quick Start

**Deployment Order:**
1. Database (PostgreSQL on Render)
2. Backend (Flask API on Render Web Service)
3. Frontend (React App on Render Static Site)
4. Extension (Chrome Web Store or local install)

**Estimated Time:** 30-45 minutes

---

## Prerequisites

### Required Accounts
- [Render Account](https://render.com/) (Free tier available)
- [OpenAI Account](https://platform.openai.com/) with API access
- [GitHub Account](https://github.com/) (recommended for auto-deploy)
- [Chrome Web Store Developer Account](https://chrome.google.com/webstore/developer/dashboard) ($5 one-time fee) - Optional for extension

### Required Tools
- Git CLI
- Node.js 18+ (for local frontend build)
- PostgreSQL client (optional, for database management)

### Required Information
- OpenAI API Key
- Secure passwords for JWT secrets
- Domain name (optional, but recommended)

---

## Backend Deployment (Render)

### Step 1: Prepare Backend Code

Ensure your `backend/build.sh` is executable and contains:

```bash
#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running database migrations..."
flask db upgrade

echo "Build completed successfully!"
```

Make it executable:
```bash
chmod +x backend/build.sh
```

### Step 2: Create Render Web Service

1. **Login to Render** → https://dashboard.render.com/

2. **Click "New +" → "Web Service"**

3. **Connect Repository:**
   - Connect your GitHub/GitLab repository
   - Or use "Public Git repository" with your repo URL

4. **Configure Web Service:**

   | Setting               | Value                                  |
   |-----------------------|----------------------------------------|
   | **Name**              | `flask-app-backend` (or your choice)   |
   | **Region**            | Choose closest to your users           |
   | **Branch**            | `main` or `dev`                        |
   | **Root Directory**    | `backend`                              |
   | **Runtime**           | `Python 3`                             |
   | **Build Command**     | `./build.sh`                           |
   | **Start Command**     | `gunicorn wsgi:app`                    |
   | **Plan**              | Free (or paid for better performance)  |

5. **Click "Advanced" and add Environment Variables:**

   | Variable                | Value                                      | Note                           |
   |-------------------------|--------------------------------------------|--------------------------------|
   | `SECRET_KEY`            | `<generate-random-32-char-string>`         | Use password generator         |
   | `JWT_SECRET_KEY`        | `<generate-random-32-char-string>`         | Different from SECRET_KEY      |
   | `OPENAI_API_KEY`        | `sk-...`                                   | From OpenAI dashboard          |
   | `FLASK_ENV`             | `production`                               | Production mode                |
   | `ADMIN_EMAIL`           | `admin@yourdomain.com`                     | Default admin email            |
   | `ADMIN_PASSWORD`        | `<secure-password>`                        | Default admin password         |
   | `ADMIN_MOBILE`          | `9999999999`                               | Default admin mobile           |
   | `ADMIN_NAME`            | `Administrator`                            | Default admin name             |
   | `FRONTEND_URL`          | `https://your-frontend.onrender.com`       | Add after frontend deployed    |

   **⚠️ Important:** `DATABASE_URL` will be added automatically when you connect PostgreSQL database in next step.

6. **Click "Create Web Service"**

7. **Wait for deployment** (5-10 minutes for first deploy)

8. **Note your backend URL:** `https://your-backend.onrender.com`

---

## Database Setup (Render PostgreSQL)

### Step 1: Create PostgreSQL Database

1. **In Render Dashboard → "New +" → "PostgreSQL"**

2. **Configure Database:**

   | Setting           | Value                              |
   |-------------------|------------------------------------|
   | **Name**          | `flask-app-db`                     |
   | **Database**      | `flask_app_db`                     |
   | **User**          | Auto-generated                     |
   | **Region**        | Same as backend                    |
   | **Plan**          | Free (or paid for production)      |

3. **Click "Create Database"**

4. **Wait for database provisioning** (2-3 minutes)

### Step 2: Connect Database to Backend

1. **Go to your PostgreSQL database page**

2. **Copy "Internal Database URL"** (starts with `postgresql://`)

3. **Go to your backend Web Service → "Environment"**

4. **Add/Update Environment Variable:**
   - Key: `DATABASE_URL`
   - Value: Paste the Internal Database URL

5. **Save Changes** → Backend will auto-redeploy

### Step 3: Verify Database Connection

1. **Go to backend "Logs" tab**
2. **Look for:**
   ```
   Database migrations completed successfully
   Default admin created: admin@yourdomain.com
   ```
3. **Test health endpoint:**
   ```bash
   curl https://your-backend.onrender.com/api/healthz
   # Should return: {"status":"ok"}
   ```

---

## Frontend Deployment (Render)

### Step 1: Prepare Frontend Build

Create `frontend/render-build.sh`:

```bash
#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
npm install

echo "Building production bundle..."
npm run build

echo "Frontend build completed!"
```

Make it executable:
```bash
chmod +x frontend/render-build.sh
```

### Step 2: Create Render Static Site

1. **In Render Dashboard → "New +" → "Static Site"**

2. **Connect Repository** (same as backend)

3. **Configure Static Site:**

   | Setting               | Value                                    |
   |-----------------------|------------------------------------------|
   | **Name**              | `flask-app-frontend`                     |
   | **Branch**            | `main` or `dev`                          |
   | **Root Directory**    | `frontend`                               |
   | **Build Command**     | `npm install && npm run build`           |
   | **Publish Directory** | `dist`                                   |

4. **Add Environment Variable:**

   | Variable         | Value                                        |
   |------------------|----------------------------------------------|
   | `VITE_API_URL`   | `https://your-backend.onrender.com/api`      |

5. **Click "Create Static Site"**

6. **Wait for deployment** (5-10 minutes)

7. **Note your frontend URL:** `https://your-frontend.onrender.com`

### Step 3: Update Backend CORS

1. **Go to backend Web Service → "Environment"**

2. **Update `FRONTEND_URL` variable:**
   - Value: `https://your-frontend.onrender.com`

3. **Save** → Backend will redeploy

### Step 4: Test Frontend

1. Visit your frontend URL
2. Try logging in with admin credentials
3. Verify API calls work (check browser console)

---

## Chrome Extension Publishing

### Option A: Load Unpacked (Development/Testing)

1. **Update Extension Config:**

   Edit `extension/manifest.json`:
   ```json
   {
     "host_permissions": [
       "https://your-backend.onrender.com/*",
       "http://*/*",
       "https://*/*"
     ]
   }
   ```

2. **Open Chrome** → `chrome://extensions/`

3. **Enable "Developer mode"** (top right)

4. **Click "Load unpacked"**

5. **Select `extension` folder**

6. **Extension is now installed** (for this browser only)

### Option B: Publish to Chrome Web Store

1. **Prepare Extension Package:**

   ```bash
   cd extension
   zip -r extension.zip . -x "*.git*" -x "*node_modules*"
   ```

2. **Chrome Web Store Developer Dashboard:**
   - Go to: https://chrome.google.com/webstore/devconsole
   - Pay $5 one-time registration fee (if first time)

3. **Create New Item:**
   - Click "New Item"
   - Upload `extension.zip`

4. **Fill Store Listing:**
   - **Name:** Data Fyre - Candidate Autofill
   - **Description:** AI-powered candidate autofill for job applications
   - **Category:** Productivity
   - **Icons:** Use `only_logo.png` (ensure 128x128px)
   - **Screenshots:** Capture extension in action (1280x800 or 640x400)
   - **Privacy Policy:** Link to your privacy policy
   - **Permissions Justification:**
     - `storage`: Store user preferences and backend URL
     - `tabs`: Detect active tab for autofill
     - `scripting`: Inject content script for form detection

5. **Submit for Review**
   - Review time: 1-7 days
   - May require revisions

6. **After Approval:**
   - Extension is publicly available
   - Users can install from Chrome Web Store

### Extension Configuration

Users need to configure backend URL (auto-detects, but can override):

1. Click extension icon
2. If backend not detected, manually set in extension settings
3. Backend URL: `https://your-backend.onrender.com`

---

## Environment Configuration

### Production Environment Variables

#### Backend (Render Web Service)

```bash
# Core
SECRET_KEY=<64-char-random-string>
JWT_SECRET_KEY=<64-char-random-string>
DATABASE_URL=<auto-from-render-postgres>

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Flask
FLASK_ENV=production

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
ADMIN_MOBILE=9999999999
ADMIN_NAME=Administrator

# CORS
FRONTEND_URL=https://your-frontend.onrender.com
```

#### Frontend (Render Static Site)

```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

### Generating Secure Secrets

**Option 1: Python**
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

**Option 2: OpenSSL**
```bash
openssl rand -base64 48
```

**Option 3: Online Generator**
- https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

---

## Post-Deployment Checklist

### Backend Verification

- [ ] Health check endpoint responds: `/api/healthz`
- [ ] Admin login works with configured credentials
- [ ] Database migrations ran successfully (check logs)
- [ ] Default admin user created
- [ ] OpenAI API key is valid (test resume generation)
- [ ] CORS allows frontend origin

### Frontend Verification

- [ ] Static site loads without errors
- [ ] Can login as admin
- [ ] Can create users
- [ ] Can create candidates
- [ ] Can generate resumes
- [ ] All API calls work (check Network tab)

### Extension Verification

- [ ] Extension installs without errors
- [ ] Backend API auto-detection works
- [ ] Can load users and candidates
- [ ] Autofill works on test forms
- [ ] No console errors

### Security Checklist

- [ ] All secrets are unique and strong (32+ characters)
- [ ] Production database uses Internal URL (not External)
- [ ] HTTPS is enforced (Render does this automatically)
- [ ] Default admin password is changed after first login
- [ ] JWT tokens have reasonable expiration (default: 1 hour)
- [ ] CORS only allows your frontend origin

---

## Troubleshooting

### Backend Issues

#### "502 Bad Gateway"

**Cause:** Backend failed to start

**Solution:**
1. Check Render logs for errors
2. Verify all required environment variables are set
3. Check `DATABASE_URL` is valid
4. Ensure `gunicorn wsgi:app` command is correct

#### "Database connection failed"

**Cause:** Invalid DATABASE_URL or database not running

**Solution:**
1. Go to PostgreSQL database → verify it's running
2. Copy "Internal Database URL" (not External)
3. Update `DATABASE_URL` in backend environment
4. Redeploy backend

#### "Migration failed"

**Cause:** Migration conflicts or schema issues

**Solution:**
```bash
# SSH into Render shell (if available) or run locally then push
flask db stamp head
flask db migrate -m "Fix migration"
flask db upgrade
```

#### "OpenAI API Error"

**Cause:** Invalid API key or quota exceeded

**Solution:**
1. Verify `OPENAI_API_KEY` in environment
2. Check OpenAI dashboard for quota/billing
3. Test key with curl:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Frontend Issues

#### "API calls fail with CORS error"

**Cause:** Backend CORS not configured for frontend origin

**Solution:**
1. Check backend `FRONTEND_URL` environment variable
2. Ensure it matches exact frontend URL (including https://)
3. Redeploy backend

#### "White screen / blank page"

**Cause:** Build errors or incorrect API URL

**Solution:**
1. Check Render build logs for errors
2. Verify `VITE_API_URL` is set correctly
3. Clear cache and hard refresh (Ctrl+Shift+R)

#### "401 Unauthorized on login"

**Cause:** Cookie issues or JWT misconfiguration

**Solution:**
1. Check JWT settings in `backend/config.py`
2. Ensure `JWT_COOKIE_SECURE = True` in production
3. Ensure `JWT_COOKIE_SAMESITE = "None"` for cross-origin
4. Verify HTTPS is used (Render enforces this)

### Extension Issues

#### "Could not detect API"

**Cause:** Backend URL not accessible from browser

**Solution:**
1. Manually verify backend URL in browser
2. Check `manifest.json` has correct `host_permissions`
3. Open popup, check console for errors
4. Try manual backend URL in extension settings (if available)

#### "Autofill doesn't work"

**Cause:** Content script not injected or field mapping failed

**Solution:**
1. Open browser console on target page
2. Check for extension errors
3. Verify form fields have `name` or `id` attributes
4. Test AI mapping endpoint manually:
   ```bash
   curl -X POST https://your-backend.onrender.com/api/ai/map-fields \
     -H "Content-Type: application/json" \
     -d '{"candidate_id": 1, "form": {"firstName": "text"}}'
   ```

---

## Making Schema Changes (Adding Columns/Fields)

### ❓ Do I Need to Recreate the Database?

**NO!** You do NOT need to delete and recreate your PostgreSQL database when adding new columns or making schema changes. Use Flask-Migrate instead.

### ✅ The Right Way: Database Migrations

Your project uses **Flask-Migrate** (Alembic) which handles schema changes without data loss.

#### Step-by-Step: Adding a New Column

**1. Update your model locally:**
```python
# backend/app/models.py
class Candidate(db.Model):
    # ... existing fields ...
    new_field = db.Column(db.String(255), nullable=True)  # Your new column
```

**2. Create migration locally:**
```bash
cd backend
flask db migrate -m "Add new_field to candidate table"
```

**3. Review the generated migration file:**
```bash
# Check backend/migrations/versions/<timestamp>_add_new_field.py
# Verify it does what you expect
```

**4. Test migration locally:**
```bash
flask db upgrade  # Apply migration
flask run         # Test your app
```

**5. Commit and push:**
```bash
git add backend/app/models.py backend/migrations/
git commit -m "Add new_field to candidate model"
git push origin main  # or your branch
```

**6. Render automatically applies migration:**
- Render detects the push
- Runs `build.sh` which includes `flask db upgrade`
- Migration is applied to production database
- **Your existing data is preserved!** ✨

#### Common Schema Changes

**Adding a Column (Safe):**
```python
# Existing rows get NULL or default value
new_column = db.Column(db.String(100), default="default_value")
```

**Making Column Optional:**
```python
# Change nullable=False to nullable=True
email = db.Column(db.String(255), nullable=True)  # was nullable=False
```

**Adding Column with NOT NULL (Requires Default):**
```python
# Must provide default or migration will fail
status = db.Column(db.String(50), nullable=False, default="active")
```

**Changing Column Type (Test First!):**
```python
# May require data conversion
phone = db.Column(db.String(50))  # was String(20)
```

**Removing a Column (Data Loss!):**
```python
# ⚠️ Deletes data permanently - make sure you have backups
# Just remove the field from your model and create migration
```

**Renaming a Column (Manual Edit Required):**
```python
# Auto-migration sees this as drop + add (causes data loss!)
# Manually edit migration file to use op.alter_column() instead
```

### 🚨 When You WOULD Need to Recreate Database

**Only in extreme cases:**
- Database is completely corrupted (rare)
- Unfixable migration conflicts (can usually be resolved)
- Development/testing environment (not production!)
- Changing database infrastructure (new server/region)

**For production: NEVER delete database without backup!**

### 🔧 Troubleshooting Migrations

#### "Migration conflict" or "Multiple heads detected"

```bash
# View migration history
flask db history

# Merge heads
flask db merge heads -m "Merge migration branches"

# Or stamp to latest and recreate
flask db stamp head
flask db migrate -m "Resolve conflict"
```

#### "Column already exists"

```bash
# Migration was already applied
# Just mark it as done:
flask db stamp head
```

#### Migration fails on Render

**Check logs for specific error:**
1. Go to Render Dashboard → Backend Service → Logs
2. Look for migration error message
3. Common fixes:
   - Column has NOT NULL but no default
   - Data type conversion fails
   - Foreign key constraint violation

**Solution:**
```bash
# Fix locally first, then push:
flask db downgrade -1  # Rollback
# Fix migration or model
flask db upgrade       # Test
git push              # Deploy to Render
```

### 📋 Migration Best Practices

**✅ DO:**
- Always create migrations for schema changes
- Test migrations locally before deploying
- Review auto-generated migration files
- Use descriptive migration messages
- Keep all migrations in version control
- Backup database before risky migrations

**❌ DON'T:**
- Manually edit database schema (bypass migrations)
- Delete migration files from git
- Delete and recreate production database
- Edit applied migrations (create new one instead)
- Skip testing migrations locally

---

## Maintenance

### Regular Tasks

#### Monitor Resource Usage

**Render Free Tier Limits:**
- 750 hours/month web service (spins down after 15 min inactivity)
- 1GB PostgreSQL database
- 100GB bandwidth/month

**Upgrade if:**
- Frequent 502 errors due to cold starts
- Database exceeds 1GB
- Need always-on service

#### Update Dependencies

**Backend:**
```bash
pip list --outdated
pip install --upgrade <package>
pip freeze > requirements.txt
git commit -am "Update dependencies"
git push
```

**Frontend:**
```bash
npm outdated
npm update
npm audit fix
git commit -am "Update dependencies"
git push
```

#### Database Backups

**Render PostgreSQL:**
1. Go to database dashboard
2. Click "Backups" tab
3. Manual backup: Click "Create Backup"
4. Automatic backups: Available on paid plans

**Manual Backup:**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
psql $DATABASE_URL < backup_20250101.sql
```

#### Log Monitoring

**Render Logs:**
- Backend logs: Web Service → Logs tab
- Database logs: PostgreSQL → Logs tab
- Set up log alerts (paid feature)

**Common Errors to Watch:**
- OpenAI API quota exceeded
- Database connection pool exhausted
- Memory errors (upgrade plan)

### Scaling Considerations

#### Vertical Scaling (Render)

**When to upgrade:**
- Cold starts too slow (Free tier spins down)
- Database size > 1GB
- High traffic causing timeouts

**Upgrade options:**
- **Web Service:** Starter ($7/mo), Standard ($25/mo)
- **PostgreSQL:** Starter ($7/mo), Standard ($20/mo)

#### Horizontal Scaling

**For very high traffic:**
- Use load balancer (Render Team plans)
- Separate read/write database replicas
- CDN for frontend assets (Render does this automatically)
- Redis for session storage (optional, advanced)

### Database Maintenance

#### Recreate Database (CAUTION: Data loss)

**When:** Schema is severely corrupted or need fresh start

**Steps:**
1. **Backup data** (export candidates/users)
2. Delete PostgreSQL database on Render
3. Create new PostgreSQL database
4. Update `DATABASE_URL` in backend environment
5. Backend will auto-run migrations on next deploy
6. Restore data if needed

#### Migration Conflicts

**Reset migrations (development only):**
```bash
# Delete all migration files except __init__.py
rm backend/migrations/versions/*.py

# Recreate
flask db migrate -m "Initial migration"
flask db upgrade
```

---

## Custom Domain (Optional)

### Backend Custom Domain

1. **Render Dashboard → Backend Service → Settings**
2. **Custom Domain section → Add custom domain**
3. **Add:** `api.yourdomain.com`
4. **Update DNS (your domain registrar):**
   - Type: `CNAME`
   - Name: `api`
   - Value: `<your-service>.onrender.com`
   - TTL: 3600
5. **Wait for SSL certificate** (automatic, 1-5 minutes)
6. **Update frontend `VITE_API_URL`:** `https://api.yourdomain.com/api`

### Frontend Custom Domain

1. **Render Dashboard → Frontend Static Site → Settings**
2. **Custom Domain → Add custom domain**
3. **Add:** `yourdomain.com` or `www.yourdomain.com`
4. **Update DNS:**
   - Type: `CNAME`
   - Name: `www` (or `@` for apex)
   - Value: `<your-site>.onrender.com`
5. **Update backend `FRONTEND_URL`:** `https://yourdomain.com`

---

## Rollback Procedure

### Backend Rollback

1. **Render Dashboard → Backend Service → "Deploys" tab**
2. **Find previous successful deploy**
3. **Click "..." → "Redeploy"**
4. **Confirm rollback**

### Database Rollback

**⚠️ Caution:** Rolling back migrations can cause data loss

```bash
# Check migration history
flask db history

# Rollback one migration
flask db downgrade -1

# Rollback to specific version
flask db downgrade <revision>
```

### Frontend Rollback

1. **Render Dashboard → Frontend Static Site → "Deploys" tab**
2. **Find previous successful deploy**
3. **Click "..." → "Redeploy"**

---

## Performance Optimization

### Backend

1. **Enable database connection pooling:**
   ```python
   # config.py
   SQLALCHEMY_ENGINE_OPTIONS = {
       "pool_size": 10,
       "pool_recycle": 3600,
       "pool_pre_ping": True
   }
   ```

2. **Cache frequently accessed data** (Redis - optional)

3. **Optimize queries:**
   - Use `lazy="joined"` for relationships
   - Add database indexes
   - Use pagination for large lists

### Frontend

1. **Code splitting:**
   ```javascript
   // Lazy load pages
   const Admin = lazy(() => import('./pages/Admin'));
   ```

2. **Optimize images:**
   - Compress logo/assets
   - Use WebP format

3. **Enable Brotli compression** (Render does this automatically)

---

## Monitoring & Alerts

### Application Monitoring

**Free Tools:**
- Render built-in metrics (CPU, Memory, Response time)
- OpenAI API usage dashboard

**Paid Tools:**
- Sentry (Error tracking)
- New Relic (APM)
- Datadog (Infrastructure monitoring)

### Set Up Alerts

**Render Alerts (Paid plans):**
- Deploy failures
- High CPU/memory
- Crash alerts

**Email Notifications:**
- Set up in Render dashboard
- Configure for critical errors only

---

## Security Best Practices

### Ongoing Security

1. **Rotate secrets regularly** (every 90 days)
   - Update `SECRET_KEY` and `JWT_SECRET_KEY`
   - Force re-login for all users

2. **Update dependencies** (monthly)
   - Check for security vulnerabilities
   - Run `npm audit` and `pip-audit`

3. **Monitor logs** for suspicious activity
   - Failed login attempts
   - Unusual API calls
   - SQL injection attempts (should be blocked by SQLAlchemy)

4. **Review user permissions**
   - Remove inactive users
   - Audit admin accounts

5. **Enable 2FA** (if implementing authentication updates)

### Compliance

**GDPR/Privacy:**
- Add privacy policy
- Implement data export feature
- Implement data deletion feature
- Log user consent

**Security Headers:**
Already handled by Render:
- HTTPS enforcement
- HSTS headers
- X-Content-Type-Options
- X-Frame-Options

---

## Cost Estimation

### Free Tier (Render)

| Service               | Free Tier Limits              | Cost if Exceeded      |
|-----------------------|-------------------------------|-----------------------|
| Web Service           | 750 hours/month, spins down   | $7/mo (Starter)       |
| PostgreSQL            | 1GB storage, 97 connections   | $7/mo (Starter)       |
| Static Site           | 100GB bandwidth/month         | Free up to 100GB      |
| **Total Monthly**     | **$0** (within limits)        | **~$14-20** if upgrade|

### Production Tier (Render)

| Service               | Plan          | Cost       | Benefits                           |
|-----------------------|---------------|------------|------------------------------------|
| Web Service           | Standard      | $25/mo     | Always-on, 2GB RAM, autoscaling    |
| PostgreSQL            | Standard      | $20/mo     | 50GB storage, daily backups        |
| Static Site           | Free          | $0         | 100GB bandwidth included           |
| **Total Monthly**     |               | **$45/mo** | Production-ready                   |

### Additional Costs

- **OpenAI API:** Pay-per-use (GPT-4: ~$0.03 per 1K tokens)
  - Estimate: $10-50/mo depending on usage
- **Custom Domain:** $10-15/year (domain registrar)
- **Chrome Web Store:** $5 one-time fee

**Total Estimated Cost (Production):** $60-100/month

---

## Support & Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [Flask Deployment](https://flask.palletsprojects.com/en/latest/deploying/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

### Community
- [Render Community](https://community.render.com/)
- [Flask Discord](https://discord.gg/pallets)

### Getting Help
- Render support: support@render.com
- Check Render status: https://status.render.com/

---

## Deployment Checklist Summary

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] OpenAI API key obtained

### Database
- [ ] PostgreSQL created on Render
- [ ] DATABASE_URL copied

### Backend
- [ ] Web Service created
- [ ] All environment variables set
- [ ] DATABASE_URL configured
- [ ] Build successful
- [ ] Health check responds
- [ ] Admin user created

### Frontend
- [ ] Static Site created
- [ ] VITE_API_URL configured
- [ ] Build successful
- [ ] Site loads correctly
- [ ] Can login and use features

### Extension
- [ ] manifest.json updated with production URLs
- [ ] Tested with production backend
- [ ] Published to Chrome Web Store (optional)

### Final
- [ ] Update backend FRONTEND_URL with actual frontend URL
- [ ] Test all user flows end-to-end
- [ ] Monitor logs for errors
- [ ] Document admin credentials securely

---

**Deployed Successfully!** 🎉

Your application is now live. Monitor the first few days closely for any issues.

**Last Updated:** October 2025

