# Render Deployment Guide for Flask-App

This guide provides step-by-step instructions for deploying your Flask + React application to Render.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Application Architecture](#application-architecture)
3. [Backend Deployment (Flask API)](#backend-deployment-flask-api)
4. [Frontend Deployment (React App)](#frontend-deployment-react-app)
5. [Database Setup (PostgreSQL)](#database-setup-postgresql)
6. [Environment Variables Configuration](#environment-variables-configuration)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- A [Render account](https://render.com/) (free tier available)
- Git repository with your code (GitHub, GitLab, or Bitbucket)
- OpenAI API key (for resume generation and AI features)
- Basic understanding of environment variables

---

## Application Architecture

Your application consists of three main components:

1. **Backend**: Flask REST API (`/backend` directory)
   - Handles authentication, candidate management, AI operations, resume generation
   - Uses SQLAlchemy ORM with PostgreSQL database
   - Serves API endpoints at `/api/*`

2. **Frontend**: React SPA (`/frontend` directory)
   - Built with Vite
   - Uses Material-UI components
   - Consumes backend API

3. **Database**: PostgreSQL
   - Stores users, candidates, and job records
   - Managed via Flask-Migrate (Alembic)

4. **Chrome Extension**: Browser extension (`/extension` directory)
   - Note: This component is not deployed to Render; users install it locally

---

## Backend Deployment (Flask API)

### Step 1: Create a New Web Service

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Configure the service:

   **Basic Settings:**
   - **Name**: `flask-app-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`

   **Build & Deploy Settings:**
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     gunicorn wsgi:app
     ```

   **Instance Type:**
   - Select **Free** or **Starter** (recommended for production)

### Step 2: Add Gunicorn to Requirements

Your `backend/requirements.txt` should include:
```
gunicorn==21.2.0
```

If not present, add this line to `backend/requirements.txt` before deploying.

### Step 3: Configure Environment Variables

In the Render dashboard for your backend service, go to the **Environment** tab and add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `PYTHON_VERSION` | `3.11.0` | Specify Python version |
| `SECRET_KEY` | `<generate-random-string>` | Flask secret key (use a strong random string) |
| `JWT_SECRET_KEY` | `<generate-random-string>` | JWT signing key (use a strong random string) |
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `DATABASE_URL` | `<postgres-connection-string>` | Auto-filled by Render if using Render PostgreSQL |
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Default admin email |
| `ADMIN_PASSWORD` | `SecurePassword123!` | Default admin password |
| `ADMIN_MOBILE` | `9876543210` | Default admin mobile |
| `ADMIN_NAME` | `Administrator` | Default admin name |

**Important Security Notes:**
- Generate strong random strings for `SECRET_KEY` and `JWT_SECRET_KEY` (use tools like `openssl rand -hex 32`)
- Keep your `OPENAI_API_KEY` private
- Change the default admin password after first login

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your Flask app with Gunicorn
3. Monitor the deployment logs for any errors
4. Once deployed, note your backend URL: `https://flask-app-backend.onrender.com`

---

## Database Setup (PostgreSQL)

### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `flask-app-database`
   - **Database**: `flask_app_db`
   - **User**: (auto-generated)
   - **Region**: Same as your backend service
   - **PostgreSQL Version**: `15` (or latest)
   - **Instance Type**: **Free** or **Starter**

3. Click **"Create Database"**

### Step 2: Link Database to Backend

1. Go to your backend web service
2. Navigate to **Environment** tab
3. Render automatically provides these variables:
   - `DATABASE_URL` (Internal connection string)
   - You can also use the External connection string if needed

**Note**: Your `config.py` already handles `DATABASE_URL` from environment variables, so no code changes needed.

### Step 3: Run Database Migrations

After your backend service is deployed:

1. Go to your backend service in Render
2. Click **"Shell"** tab (opens a terminal to your running instance)
3. Run these commands:

```bash
cd /opt/render/project/src
flask db upgrade
```

This will:
- Create all database tables
- Run any pending migrations
- Create the default admin user (based on environment variables)

**Alternative**: Add a **Deploy Hook** or use Render's **Build Command**:
```bash
pip install -r requirements.txt && flask db upgrade
```

---

## Frontend Deployment (React App)

### Step 1: Create a Static Site

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your Git repository
3. Configure:

   **Basic Settings:**
   - **Name**: `flask-app-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`

   **Build Settings:**
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**:
     ```
     dist
     ```

### Step 2: Configure API Base URL

Update `frontend/src/api.js` to use your deployed backend URL:

```javascript
const API = import.meta.env.PROD 
  ? "https://flask-app-backend.onrender.com/api"  // Replace with your actual backend URL
  : "http://localhost:5000/api";
```

**Alternative (Recommended)**: Use environment variables in Vite:

1. Create `frontend/.env.production`:
   ```
   VITE_API_URL=https://flask-app-backend.onrender.com/api
   ```

2. Update `frontend/src/api.js`:
   ```javascript
   const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
   ```

### Step 3: Update Backend CORS Configuration

In `backend/app/__init__.py`, update the CORS configuration to allow your frontend domain:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://flask-app-frontend.onrender.com"  # Add your frontend URL
        ]
    }
}, supports_credentials=True)
```

**Important**: Replace `flask-app-frontend.onrender.com` with your actual Render frontend URL.

### Step 4: Deploy Frontend

1. Click **"Create Static Site"**
2. Render will:
   - Install Node.js dependencies
   - Build your React app
   - Serve static files
3. Your frontend will be available at: `https://flask-app-frontend.onrender.com`

---

## Environment Variables Configuration

### Backend Environment Variables (Complete List)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PYTHON_VERSION` | Yes | Python runtime version | `3.11.0` |
| `SECRET_KEY` | Yes | Flask session secret | `5f2d6c8b9a3e1f7d4a6b8c9e1f2a3b4c` |
| `JWT_SECRET_KEY` | Yes | JWT token signing key | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-proj-...` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | Auto-filled by Render |
| `ADMIN_EMAIL` | No | Default admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | No | Default admin password | `Passw0rd!` |
| `ADMIN_MOBILE` | No | Default admin mobile | `9999999999` |
| `ADMIN_NAME` | No | Default admin name | `Administrator` |

### Frontend Environment Variables

Add these in the **Environment** section of your Static Site (if using env vars):

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://flask-app-backend.onrender.com/api` | Backend API URL |

---

## Post-Deployment Steps

### 1. Verify Backend Health

Visit: `https://flask-app-backend.onrender.com/api/healthz`

Expected response:
```json
{
  "status": "ok"
}
```

### 2. Test Admin Login

1. Go to your frontend URL
2. Navigate to Admin Login
3. Use credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables

### 3. Run Database Migrations (If Not Done)

```bash
# In Render Shell for backend service
flask db upgrade
```

### 4. Update Chrome Extension

Update `extension/background.js` and `extension/contentScript.js` to point to your deployed backend:

```javascript
const API_BASE = "https://flask-app-backend.onrender.com";
```

**Note**: Users will need to manually update and reload the extension after deployment.

### 5. Monitor Application Logs

- Go to Render Dashboard
- Select your service
- Click **"Logs"** tab to monitor real-time logs

---

## Troubleshooting

### Common Issues and Solutions

#### 1. **Backend Fails to Start**

**Error**: `ModuleNotFoundError` or `ImportError`

**Solution**:
- Ensure all dependencies are listed in `requirements.txt`
- Check Python version matches your local development environment
- Review build logs in Render dashboard

**Commands to verify locally**:
```bash
cd backend
pip install -r requirements.txt
python wsgi.py
```

---

#### 2. **Database Connection Errors**

**Error**: `FATAL: password authentication failed` or `connection refused`

**Solution**:
- Verify `DATABASE_URL` is set correctly in environment variables
- Ensure your PostgreSQL instance is running
- Check if database migrations have been run

**Verify connection**:
```bash
# In Render Shell
python -c "from app import create_app; app = create_app(); print('DB Connected')"
```

---

#### 3. **CORS Errors in Frontend**

**Error**: `Access to fetch has been blocked by CORS policy`

**Solution**:
- Add your frontend URL to CORS origins in `backend/app/__init__.py`
- Redeploy backend after updating CORS configuration
- Clear browser cache

**Example fix**:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://flask-app-frontend.onrender.com",
            "http://localhost:5173"
        ]
    }
}, supports_credentials=True)
```

---

#### 4. **OpenAI API Errors**

**Error**: `Error code: 401 - Incorrect API key` or `Error code: 429 - Rate limit exceeded`

**Solution**:
- Verify `OPENAI_API_KEY` is correctly set in environment variables
- Check OpenAI account for API usage limits
- Ensure API key has sufficient credits

**Test API key**:
```bash
# In Render Shell
python -c "import os; print(os.getenv('OPENAI_API_KEY')[:20] + '...')"
```

---

#### 5. **Frontend Not Connecting to Backend**

**Error**: `Failed to fetch` or `Network error`

**Solution**:
- Check `VITE_API_URL` or hardcoded API URL in `frontend/src/api.js`
- Ensure backend URL is correct (including `/api` suffix)
- Verify backend is running and accessible

**Test backend from browser console**:
```javascript
fetch('https://flask-app-backend.onrender.com/api/healthz')
  .then(r => r.json())
  .then(console.log)
```

---

#### 6. **Database Migrations Not Applied**

**Error**: `relation "user" does not exist` or similar

**Solution**:
- Run migrations manually via Render Shell
- Or add migrations to build command

**Manual migration**:
```bash
# In Render Shell
cd /opt/render/project/src
flask db upgrade
```

**Automatic migration (Build Command)**:
```bash
pip install -r requirements.txt && flask db upgrade
```

---

#### 7. **File Generation Errors (Resume PDF)**

**Error**: `LibreOffice not found` or `PDF conversion failed`

**Solution**:
- PDF generation requires LibreOffice, which may not be available on Render free tier
- Your code already handles this by supporting Word format
- Ensure users generate resumes in Word format (`.docx`)

**Note**: PDF generation is currently commented out in `candidateresumebuilder.py` and returns a 501 error.

---

#### 8. **Environment Variables Not Loading**

**Error**: Variables return `None` or default values

**Solution**:
- Double-check variable names (case-sensitive)
- Ensure `python-dotenv` is installed (already in requirements.txt)
- Verify `load_dotenv()` is called in `config.py` (already configured)
- Restart the service after adding new environment variables

**Verify in Render Shell**:
```bash
python -c "import os; print(os.getenv('SECRET_KEY'))"
```

---

#### 9. **Free Tier Service Sleeping**

**Issue**: Backend spins down after inactivity (15 minutes on free tier)

**Solution**:
- Upgrade to Starter plan ($7/month) for always-on service
- Or use a monitoring service (UptimeRobot) to ping your backend every 10 minutes

**Ping URL**: `https://flask-app-backend.onrender.com/api/healthz`

---

#### 10. **Build Timeouts**

**Error**: Build exceeds time limit

**Solution**:
- Remove unnecessary dependencies from `requirements.txt`
- Use lighter packages where possible
- Consider upgrading to a paid plan for faster builds

---

### Additional Debugging Tips

#### Check Logs
- Always review **Logs** tab in Render dashboard
- Look for Python tracebacks and error messages
- Check both build logs and runtime logs

#### Use Render Shell
- Access your running instance via **Shell** tab
- Test Python imports, database connections, file permissions
- Run one-off commands for debugging

#### Test Locally First
- Always test deployment configuration locally:
  ```bash
  # Backend
  cd backend
  pip install -r requirements.txt
  gunicorn wsgi:app
  
  # Frontend
  cd frontend
  npm install
  npm run build
  npx serve -s dist
  ```

---

## Deployment Checklist

Use this checklist to ensure everything is configured correctly:

### Pre-Deployment
- [ ] All code committed and pushed to Git repository
- [ ] `requirements.txt` includes `gunicorn`
- [ ] `python-dotenv` is in `requirements.txt`
- [ ] Frontend API URL configured for production
- [ ] CORS configuration includes production frontend URL
- [ ] `.env` files are in `.gitignore` (never commit secrets)

### Backend Deployment
- [ ] PostgreSQL database created on Render
- [ ] Backend web service created
- [ ] All environment variables configured
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `gunicorn wsgi:app`
- [ ] Root directory: `backend`
- [ ] Service deployed successfully
- [ ] Health check endpoint returns 200 OK

### Database Setup
- [ ] Database linked to backend service
- [ ] Migrations run via Shell or build command
- [ ] Default admin user created
- [ ] Can connect to database from backend

### Frontend Deployment
- [ ] Static site created on Render
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] Root directory: `frontend`
- [ ] API URL points to deployed backend
- [ ] Site deployed successfully
- [ ] Can access frontend in browser

### Post-Deployment
- [ ] Admin login works
- [ ] User login works
- [ ] Can create and view candidates
- [ ] Resume generation works
- [ ] AI form field mapping works
- [ ] Chrome extension updated with production URLs
- [ ] All API endpoints tested
- [ ] Error monitoring set up (optional)

---

## Production Recommendations

### 1. **Use Paid Plans**
- **Backend**: Starter plan ($7/month) for always-on service
- **Database**: Starter plan for better performance and backups
- **Frontend**: Free tier is sufficient for static sites

### 2. **Enable Automatic Deploys**
- Configure automatic deploys from your `main` branch
- Set up staging branch for testing before production

### 3. **Set Up Custom Domain** (Optional)
- Add custom domain in Render settings
- Update CORS configuration with custom domain
- Update frontend API URL

### 4. **Enable HTTPS** (Automatic on Render)
- Render provides free SSL certificates
- Update JWT cookie settings for production:
  ```python
  JWT_COOKIE_SECURE = True  # Enable in production
  ```

### 5. **Monitor Application**
- Use Render's built-in metrics
- Set up external monitoring (e.g., Datadog, Sentry)
- Monitor OpenAI API usage and costs

### 6. **Database Backups**
- Enable automatic backups on paid PostgreSQL plans
- Regularly export data for disaster recovery

### 7. **Environment-Specific Configurations**
- Create separate Render services for staging and production
- Use different databases for each environment
- Test changes in staging before production deploy

---

## Cost Estimates (Render Pricing as of 2024)

| Service | Free Tier | Paid Tier | Recommended |
|---------|-----------|-----------|-------------|
| **Backend Web Service** | Free (spins down after 15 min) | Starter: $7/month | Starter |
| **PostgreSQL Database** | Free (expires after 90 days) | Starter: $7/month | Starter |
| **Frontend Static Site** | Free | N/A | Free |
| **Total Monthly Cost** | $0 (with limitations) | $14/month | $14/month |

**Note**: Prices may vary. Check [Render Pricing](https://render.com/pricing) for current rates.

---

## Support and Resources

- **Render Documentation**: https://render.com/docs
- **Flask Documentation**: https://flask.palletsprojects.com/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **OpenAI API Documentation**: https://platform.openai.com/docs

---

## Security Best Practices

1. **Never commit sensitive data**:
   - Keep `.env` files in `.gitignore`
   - Use Render's environment variables for secrets

2. **Use strong secrets**:
   - Generate random strings for `SECRET_KEY` and `JWT_SECRET_KEY`
   - Use minimum 32 characters

3. **Rotate credentials regularly**:
   - Change admin password after first login
   - Rotate API keys periodically

4. **Enable HTTPS only**:
   - Set `JWT_COOKIE_SECURE = True` in production
   - Force HTTPS redirects

5. **Monitor API usage**:
   - Track OpenAI API costs
   - Set usage limits if possible

6. **Database security**:
   - Use Render's internal DATABASE_URL (not external)
   - Restrict database access to backend service only

---

## Conclusion

Your Flask + React application should now be successfully deployed on Render! 

If you encounter any issues not covered in this guide, check:
1. Render Dashboard Logs
2. Application error messages
3. Browser console (for frontend issues)

For further assistance, consult Render's support or your development team.

---

**Document Version**: 1.0  
**Last Updated**: October 22, 2025  
**Deployment Target**: Render.com

