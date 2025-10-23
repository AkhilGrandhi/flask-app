# Flask + React Application Deployment Guide for Render

This guide will walk you through deploying your Flask backend and React frontend application to Render.

---

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Application Overview](#application-overview)
3. [Step 1: Prepare Your Code](#step-1-prepare-your-code)
4. [Step 2: Push to GitHub](#step-2-push-to-github)
5. [Step 3: Create PostgreSQL Database](#step-3-create-postgresql-database)
6. [Step 4: Deploy Flask Backend](#step-4-deploy-flask-backend)
7. [Step 5: Deploy React Frontend](#step-5-deploy-react-frontend)
8. [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
9. [Step 7: Run Database Migrations](#step-7-run-database-migrations)
10. [Step 8: Test Your Deployment](#step-8-test-your-deployment)
11. [Troubleshooting](#troubleshooting)
12. [Updating Your Application](#updating-your-application)

---

## Prerequisites

Before you begin, make sure you have:

- ✅ **Render Account**: Sign up at [render.com](https://render.com) (free tier available)
- ✅ **GitHub Account**: Your code must be in a GitHub repository
- ✅ **Git Installed**: On your local machine
- ✅ **Working Application**: Your app works locally

---

## Application Overview

Your application consists of:

- **Backend**: Flask REST API (Python)
  - Port: 5000 (local)
  - Database: PostgreSQL (production) or SQLite (local)
  - Authentication: JWT with cookies
  
- **Frontend**: React (Vite)
  - Port: 5173 (local)
  - Build tool: Vite
  
- **Extension**: Chrome Extension (optional, deployed separately)

---

## Step 1: Prepare Your Code

### 1.1 Create `.gitignore` (if not exists)

Create `.gitignore` in your project root:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
*.egg-info/
dist/
build/
venv/
env/

# Environment variables
.env
*.env
.env.local

# Database
*.db
*.sqlite
*.sqlite3
instance/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Build outputs
dist/
build/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
```

### 1.2 Verify `requirements.txt`

Check `backend/requirements.txt` includes all dependencies:

```txt
Flask==3.0.3
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.7
Flask-JWT-Extended==4.6.0
Flask-CORS==6.0.1
python-dotenv==1.0.1
openai==1.102.0
python-docx==1.2.0
Werkzeug==3.1.3
psycopg2-binary==2.9.9
gunicorn==21.2.0
```

**Important**: Use `psycopg2-binary` instead of `psycopg2` (easier to install on Render).

### 1.3 Create `runtime.txt` (Pin Python Version)

Create `backend/runtime.txt` to avoid Python 3.13 compatibility issues:

```txt
python-3.11.8
```

This ensures Render uses Python 3.11 which is stable and fully compatible with all dependencies.

### 1.4 Verify `package.json`

Check `frontend/package.json` has build script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.5 Update CORS Settings

In `backend/app/__init__.py`, update CORS to accept your Render domains:

```python
# Will update after deployment with actual URLs
CORS(app, 
     resources={r"/api/*": {
         "origins": [
             "http://localhost:5173",
             "http://localhost:3000",
             "https://your-frontend-app.onrender.com"  # Add after frontend is deployed
         ]
     }}, 
     supports_credentials=True)
```

---

## Step 2: Push to GitHub

### 2.1 Initialize Git Repository

If you haven't already:

```bash
cd C:\Users\AkhilGrandhi\Downloads\flask-app
git init
git add .
git commit -m "Initial commit - Flask + React app"
```

### 2.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Name: `flask-react-app` (or your preferred name)
4. **Don't** initialize with README (we already have code)
5. Click **"Create repository"**

### 2.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/flask-react-app.git
git branch -M main
git push -u origin main
```

**Replace** `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Create PostgreSQL Database

### 3.1 Create Database on Render

1. **Go to Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. **Configure Database**:
   - **Name**: `flask-app-database`
   - **Database**: `flask_app_db` (auto-filled)
   - **User**: `flask_app_db_user` (auto-filled)
   - **Region**: Choose closest to you (e.g., Oregon, Ohio, Frankfurt)
   - **Plan**: **Free** (for testing) or **Starter $7/month** (for production)

4. Click **"Create Database"**

5. **Wait 2-3 minutes** for database to provision

### 3.2 Get Database Credentials

After database is created, you'll see:

- **Internal Database URL**: `postgresql://user:pass@hostname/dbname` (use this for backend)
- **External Database URL**: For connecting from your local machine
- **PSQL Command**: For command-line access

**Copy the Internal Database URL** - you'll need it for the backend.

---

## Step 4: Deploy Flask Backend

### 4.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**:
   - If first time: Click **"Connect GitHub"** and authorize Render
   - Select your repository: `flask-react-app`

3. **Configure Service**:

   | Setting | Value |
   |---------|-------|
   | **Name** | `flask-app-backend` |
   | **Region** | Same as database |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn wsgi:app` |
   | **Plan** | **Free** or **Starter $7/month** |

4. **Advanced Settings** (click to expand):
   - **Auto-Deploy**: `Yes` (deploys automatically on git push)

### 4.2 Add Environment Variables

Scroll to **"Environment Variables"** section and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Internal Database URL from Step 3.2 |
| `SECRET_KEY` | Generate random string (use: `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `JWT_SECRET_KEY` | Generate random string (different from SECRET_KEY) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | Strong password for admin |
| `ADMIN_MOBILE` | `9999999999` |
| `ADMIN_NAME` | `Administrator` |
| `PYTHON_VERSION` | `3.10.0` |

**To generate secure keys**:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Run this twice to get two different keys for `SECRET_KEY` and `JWT_SECRET_KEY`.

### 4.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Watch the logs - should see:
   ```
   ==> Building...
   ==> Installing dependencies...
   ==> Starting...
   [INFO] Starting gunicorn...
   ```

4. Once deployed, you'll get a URL like:
   ```
   https://flask-app-backend.onrender.com
   ```

### 4.4 Verify Backend is Running

Open in browser:
```
https://flask-app-backend.onrender.com/api/healthz
```

Should return:
```json
{"status": "ok"}
```

---

## Step 5: Deploy React Frontend

### 5.1 Update API Configuration

In `frontend/src/api.js`, update the API URL:

```javascript
// Change this line:
const API = "/api";

// To use environment variable:
const API = import.meta.env.VITE_API_URL || "/api";
```

### 5.2 Create Build Configuration

Create `frontend/render-build.sh`:

```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build
```

Make it executable (on Mac/Linux):
```bash
chmod +x frontend/render-build.sh
```

On Windows, Git Bash will handle this automatically.

### 5.3 Create Web Service for Frontend

1. Click **"New +"** → **"Static Site"**
2. **Connect Repository**: Select `flask-react-app`

3. **Configure Static Site**:

   | Setting | Value |
   |---------|-------|
   | **Name** | `flask-app-frontend` |
   | **Branch** | `main` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

4. **Environment Variables**:
   - Click **"Advanced"**
   - Add variable:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://flask-app-backend.onrender.com/api`
     
   **Replace** `flask-app-backend` with your actual backend URL from Step 4.3.

5. Click **"Create Static Site"**

6. Wait for deployment (3-5 minutes)

7. Once deployed, you'll get a URL like:
   ```
   https://flask-app-frontend.onrender.com
   ```

---

## Step 6: Configure Environment Variables

### 6.1 Update Backend CORS

Now that you have the frontend URL, update CORS:

1. Go to your backend service in Render
2. Go to **"Environment"** tab
3. Add new environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://flask-app-frontend.onrender.com`

4. Update `backend/app/__init__.py`:

```python
import os

# In create_app():
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS(app, 
     resources={r"/api/*": {
         "origins": [
             "http://localhost:5173",
             "http://localhost:3000",
             frontend_url
         ]
     }}, 
     supports_credentials=True)
```

5. **Commit and push** changes:
```bash
git add .
git commit -m "Add CORS configuration for production"
git push
```

Render will auto-deploy the changes.

---

## Step 7: Run Database Migrations

### 7.1 Access Backend Shell

1. Go to your backend service in Render
2. Click **"Shell"** tab (top right)
3. Wait for shell to connect

### 7.2 Run Migrations

In the Render Shell:

```bash
# Check database connection
python -c "from app import create_app; app = create_app(); print('Connected to:', app.config['SQLALCHEMY_DATABASE_URI'][:50])"

# Run migrations
flask db upgrade

# Verify tables were created
python -c "from app import create_app; from app.models import db, User; app = create_app(); app.app_context().push(); print('Users:', User.query.count())"
```

You should see output like:
```
Connected to: postgresql://user@host/db...
INFO  [alembic.runtime.migration] Running upgrade -> d49adb647396, init
Users: 1
```

### 7.3 Verify Admin User

```bash
python -c "from app import create_app; from app.models import User; app = create_app(); app.app_context().push(); admin = User.query.filter_by(role='admin').first(); print('Admin:', admin.email if admin else 'Not found')"
```

Should show:
```
Admin: admin@example.com
```

---

## Step 8: Test Your Deployment

### 8.1 Test Backend API

Open browser and test these endpoints:

1. **Health Check**:
   ```
   https://flask-app-backend.onrender.com/api/healthz
   ```
   Should return: `{"status": "ok"}`

2. **Try to access protected endpoint** (should fail without auth):
   ```
   https://flask-app-backend.onrender.com/api/candidates
   ```
   Should return: 401 Unauthorized

### 8.2 Test Frontend

1. Open: `https://flask-app-frontend.onrender.com`

2. **Login as Admin**:
   - Email: `admin@example.com`
   - Password: (the password you set in ADMIN_PASSWORD env var)

3. **Create a User**:
   - Go to Admin → Manage Users
   - Create a new user with mobile number and password

4. **Logout and Login as User**:
   - Login with mobile number

5. **Create a Candidate**:
   - Click "Add Candidate"
   - Fill in the form
   - Submit

6. **Add a Job**:
   - Go to candidate details
   - Add job ID and description
   - Should generate and download resume

### 8.3 Test Full Flow

Complete workflow:
1. ✅ Login (JWT cookie set)
2. ✅ Create candidate (data saved to PostgreSQL)
3. ✅ Add job (calls OpenAI API)
4. ✅ Generate resume (downloads .docx file)
5. ✅ View candidate details (data persists)
6. ✅ Logout (JWT cleared)

---

## Troubleshooting

### Issue 1: psycopg2 ImportError (Python 3.13)

**Symptom**: Deploy fails with error:
```
ImportError: undefined symbol: _PyInterpreterState_Get
```

**Cause**: Python 3.13 incompatibility with `psycopg2`

**Solution**:

1. **Update `requirements.txt`**:
   - Change `psycopg2==2.9.3` to `psycopg2-binary==2.9.9`

2. **Create `backend/runtime.txt`**:
   ```txt
   python-3.11.8
   ```

3. **Commit and push**:
   ```bash
   git add backend/requirements.txt backend/runtime.txt
   git commit -m "Fix psycopg2 compatibility - pin Python 3.11"
   git push
   ```

4. Render will automatically redeploy with Python 3.11

### Issue 2: Backend Won't Start

**Symptom**: Backend shows "Deploy failed" or crashes

**Solutions**:

1. **Check Logs**:
   - Go to backend service → "Logs" tab
   - Look for error messages

2. **Common Errors**:

   **"ModuleNotFoundError"**:
   - Missing package in `requirements.txt`
   - Add it and push

   **"Database connection failed"**:
   - Check `DATABASE_URL` is set correctly
   - Verify database is running
   - Ensure backend and database are in same region

   **"Port binding error"**:
   - Render automatically sets `PORT` environment variable
   - Update `wsgi.py` if needed:
     ```python
     if __name__ == "__main__":
         port = int(os.environ.get("PORT", 5000))
         app.run(host="0.0.0.0", port=port)
     ```

3. **Test Locally with PostgreSQL**:
   ```bash
   DATABASE_URL=<your-render-database-external-url> python wsgi.py
   ```

### Issue 3: Frontend 404 Errors

**Symptom**: Frontend routes show 404 on refresh

**Solution**: Add `_redirects` file for client-side routing

Create `frontend/public/_redirects`:
```
/*    /index.html   200
```

This tells Render to serve `index.html` for all routes (for React Router).

**Commit and push**:
```bash
git add frontend/public/_redirects
git commit -m "Add redirects for client-side routing"
git push
```

### Issue 4: CORS Errors

**Symptom**: Frontend can't connect to backend, "CORS policy" error in browser console

**Solutions**:

1. **Verify CORS Configuration**:
   - Check `FRONTEND_URL` environment variable is set on backend
   - Verify frontend URL matches exactly (no trailing slash)

2. **Check Cookie Settings**:
   - In `config.py`, ensure:
     ```python
     JWT_COOKIE_SECURE = False  # Set to True if using HTTPS
     JWT_COOKIE_SAMESITE = "None"  # For cross-domain
     JWT_COOKIE_CSRF_PROTECT = False
     ```

3. **Update for Production**:
   ```python
   # In config.py
   import os
   
   # Detect if running on Render
   is_production = os.getenv("RENDER") is not None
   
   JWT_COOKIE_SECURE = is_production
   JWT_COOKIE_SAMESITE = "None" if is_production else "Lax"
   ```

### Issue 5: "UNAUTHORIZED" After Login

**Symptom**: Can login but subsequent requests return 401

**Solutions**:

1. **Check Cookies**:
   - Open DevTools → Application → Cookies
   - Verify `access_token_cookie` is present
   - Check domain matches your frontend URL

2. **Verify JWT Configuration**:
   - Ensure `JWT_SECRET_KEY` is the same across deploys
   - If you changed it, users must re-login

3. **Test in Incognito Mode**:
   - Old cookies might be causing issues

### Issue 6: OpenAI API Errors

**Symptom**: Resume generation fails with 401 or 429 errors

**Solutions**:

1. **Check API Key**:
   - Go to backend → Environment → `OPENAI_API_KEY`
   - Verify key is correct and active
   - Test at: https://platform.openai.com/api-keys

2. **Rate Limits**:
   - OpenAI free tier has rate limits
   - Upgrade plan or add retry logic

3. **Test API Key**:
   ```bash
   # In Render Shell
   python -c "import os; from openai import OpenAI; client = OpenAI(api_key=os.getenv('OPENAI_API_KEY')); print('API Key valid!' if client.models.list() else 'Invalid key')"
   ```

### Issue 7: Database Migration Errors

**Symptom**: Tables not created, migration fails

**Solutions**:

1. **Check Database Connection**:
   ```bash
   # In Render Shell
   python -c "from app import create_app; app = create_app(); print(app.config['SQLALCHEMY_DATABASE_URI'])"
   ```

2. **Reset Migrations** (DANGER: Deletes all data):
   ```bash
   # In Render Shell
   python -c "from app import create_app; from app.models import db; app = create_app(); app.app_context().push(); db.drop_all(); db.create_all(); print('Database reset!')"
   
   # Re-run migrations
   flask db upgrade
   ```

3. **Manual Table Creation**:
   ```bash
   python -c "from app import create_app; from app.models import db; app = create_app(); app.app_context().push(); db.create_all()"
   ```

### Issue 8: Free Tier Spindown

**Symptom**: First request after inactivity is slow (30+ seconds)

**Explanation**: Render free tier spins down after 15 minutes of inactivity

**Solutions**:

1. **Upgrade to Paid Plan**: $7/month for always-on
2. **Use UptimeRobot**: Ping your app every 14 minutes (keeps it awake)
3. **Inform Users**: Add loading message explaining first-load delay

---

## Updating Your Application

### Automatic Deployment (Recommended)

Render auto-deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push
```

Render will automatically:
1. Detect the push
2. Build the updated code
3. Deploy new version
4. Zero-downtime deployment

### Manual Deployment

From Render Dashboard:
1. Go to your service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Rolling Back

If something breaks:
1. Go to service → **"Events"** tab
2. Find previous successful deploy
3. Click **"Rollback to this deploy"**

---

## Best Practices for Production

### Security

1. **Use Strong Secrets**:
   ```bash
   # Generate secure keys
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Enable HTTPS**:
   - Render provides free SSL/TLS
   - Set `JWT_COOKIE_SECURE = True`

3. **Protect Admin Panel**:
   - Use strong admin password
   - Consider IP whitelist for admin routes

4. **Environment Variables**:
   - Never commit `.env` files
   - Rotate secrets regularly

### Performance

1. **Database Connection Pooling**:
   ```python
   # In config.py
   SQLALCHEMY_ENGINE_OPTIONS = {
       "pool_pre_ping": True,
       "pool_recycle": 300,
   }
   ```

2. **Enable Caching**:
   - Consider Redis for session storage
   - Cache OpenAI responses

3. **Optimize Database Queries**:
   - Add indexes to frequently queried columns
   - Use `lazy="dynamic"` for large relationships

### Monitoring

1. **Check Logs Regularly**:
   - Render Dashboard → Logs tab
   - Look for errors, warnings

2. **Set Up Alerts**:
   - Render can email you on deploy failures
   - Configure in service settings

3. **Monitor Database**:
   - Check disk usage (Render Dashboard → Database → Metrics)
   - Free tier: 1GB storage

### Backups

1. **Database Backups**:
   - Render Starter plans include daily backups
   - Free tier: No automatic backups (export manually)

2. **Manual Backup**:
   ```bash
   # Export database
   pg_dump -h <host> -U <user> -d <database> > backup.sql
   ```

3. **Code Backups**:
   - GitHub is your backup
   - Consider GitHub Actions for automated testing

---

## Cost Breakdown

### Free Tier (For Testing)

- **PostgreSQL**: Free (1GB, suspends after 90 days of inactivity)
- **Backend Web Service**: Free (spins down after 15min inactivity)
- **Frontend Static Site**: Free (100GB bandwidth/month)
- **Total**: $0/month

**Limitations**:
- Services spin down when inactive
- PostgreSQL limited to 1GB
- Slower performance

### Production Tier

- **PostgreSQL**: $7/month (10GB, always-on, daily backups)
- **Backend Web Service**: $7/month (always-on, better performance)
- **Frontend Static Site**: Free (or $1/month for more bandwidth)
- **Total**: ~$14-15/month

**Benefits**:
- Always-on, no spindown
- Better performance
- Automatic backups
- Custom domains

---

## Custom Domain (Optional)

### Add Custom Domain

1. **Buy Domain**: From Namecheap, GoDaddy, etc.

2. **Frontend**:
   - Render → Frontend service → Settings → Custom Domain
   - Add: `www.yourdomain.com`
   - Update DNS:
     ```
     Type: CNAME
     Name: www
     Value: flask-app-frontend.onrender.com
     ```

3. **Backend**:
   - Add: `api.yourdomain.com`
   - Update DNS:
     ```
     Type: CNAME
     Name: api
     Value: flask-app-backend.onrender.com
     ```

4. **Update Environment Variables**:
   - Backend `FRONTEND_URL`: `https://www.yourdomain.com`
   - Frontend `VITE_API_URL`: `https://api.yourdomain.com/api`

5. **Wait for SSL**:
   - Render automatically provisions SSL certificates
   - Takes 5-10 minutes

---

## Chrome Extension Deployment

Your Chrome extension can't be deployed to Render (it's a browser extension), but you can publish it:

### Option 1: Chrome Web Store

1. **Package Extension**:
   ```bash
   cd extension
   zip -r extension.zip . -x "*.git*"
   ```

2. **Create Developer Account**:
   - Go to: [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - One-time fee: $5

3. **Upload Extension**:
   - Upload `extension.zip`
   - Fill in details, screenshots
   - Submit for review (1-3 days)

### Option 2: Manual Installation (Development)

Share the `extension` folder:
1. Users go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your `extension` folder

### Update Extension for Production

In `extension/contentScript.js`, update API URL:

```javascript
const API_BASE = "https://flask-app-backend.onrender.com/api";
```

---

## Summary Checklist

### Pre-Deployment
- [ ] Code works locally
- [ ] `.gitignore` configured
- [ ] Code pushed to GitHub
- [ ] `requirements.txt` has all dependencies
- [ ] OpenAI API key ready

### Render Setup
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Backend web service created
- [ ] Frontend static site created
- [ ] All environment variables set

### Configuration
- [ ] CORS configured with frontend URL
- [ ] Database migrations run
- [ ] Admin user created
- [ ] API endpoints tested

### Testing
- [ ] Can login as admin
- [ ] Can create user
- [ ] Can create candidate
- [ ] Can generate resume
- [ ] Can view/edit candidates

### Optional
- [ ] Custom domain configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Chrome extension published

---

## Support & Resources

### Render Documentation
- [Render Docs](https://render.com/docs)
- [Deploy Flask App](https://render.com/docs/deploy-flask)
- [Deploy React App](https://render.com/docs/deploy-create-react-app)

### Troubleshooting
- [Render Community](https://community.render.com/)
- [Render Status](https://status.render.com/)

### Your Application
- Backend Health: `https://YOUR-BACKEND.onrender.com/api/healthz`
- Frontend: `https://YOUR-FRONTEND.onrender.com`
- Database: Check Render Dashboard

---

## Next Steps

After successful deployment:

1. **Share with Users**: Give them the frontend URL
2. **Create User Accounts**: Add users via admin panel
3. **Monitor Logs**: Check for errors daily
4. **Gather Feedback**: Iterate on features
5. **Consider Upgrades**: If traffic grows, upgrade to paid plans

---

**Congratulations! Your Flask + React application is now live on Render!** 🎉

For questions or issues, check the Troubleshooting section or reach out to Render support.

**Document Version**: 2.0  
**Last Updated**: October 23, 2025  
**Author**: Deployment Guide for Flask-React-App

