# CORS Error Fix Guide

## Issues Identified

Your application was experiencing the following errors:

1. **CORS Preflight Error**: "Response to preflight request doesn't pass access control check"
2. **Network Error**: Failed to load resource: net::ERR_FAILED
3. **404 Error**: Failed to load resource: the server responded with a status of 404

## Root Causes

### 1. Incorrect Backend URL
- **Problem**: Frontend was trying to connect to `https://flask-app-dev-70xj.onrender.com`
- **Solution**: Updated to use the correct service name `https://flask-app-backend-dev.onrender.com`

### 2. CORS Preflight Handling
- **Problem**: Flask-CORS wasn't properly handling OPTIONS requests
- **Solution**: Added explicit preflight request handler with proper CORS headers

### 3. Missing Error Handlers
- **Problem**: 404 and 500 errors didn't include CORS headers, causing failures
- **Solution**: Added error handlers with CORS headers for all error responses

## Changes Made

### Backend Changes (`backend/app/__init__.py`)

1. **Enhanced CORS Configuration**:
   - Added `X-Requested-With` to allowed headers
   - Added `always_send=True` to ensure CORS headers are always sent
   - Added better logging for debugging

2. **Explicit Preflight Handler**:
   ```python
   @app.before_request
   def handle_preflight():
       if request.method == "OPTIONS":
           # Return proper CORS headers for preflight requests
   ```

3. **Error Handlers**:
   - Added 404 handler with CORS headers
   - Added 500 handler with CORS headers
   - Added root endpoints for health checks

### Frontend Changes (`frontend/src/api.js`)

1. **Updated Backend URL Detection**:
   - Changed from `flask-app-dev-70xj.onrender.com` to `flask-app-backend-dev.onrender.com`
   - Added console logging for debugging
   - Better environment variable support

## Deployment Steps

### Step 1: Commit and Push Changes

```bash
git add .
git commit -m "Fix CORS errors and update backend URL"
git push origin dev
```

### Step 2: Verify Render Configuration

1. Go to your Render dashboard: https://dashboard.render.com
2. Find the **flask-app-backend-dev** service
3. Verify the following environment variables are set:
   - `FRONTEND_URL`: `https://flask-app-frontend-dev.onrender.com`
   - `FLASK_ENV`: `production`
   - `DATABASE_URL`: (should be set)
   - `SECRET_KEY`: (should be auto-generated)
   - `JWT_SECRET_KEY`: (should be auto-generated)

### Step 3: Check Backend Service Name

1. In Render dashboard, verify your backend service is named **flask-app-backend-dev**
2. The URL should be: `https://flask-app-backend-dev.onrender.com`
3. If the URL is different (like `flask-app-dev-70xj.onrender.com`), you have two options:
   - **Option A**: Update `frontend/src/api.js` line 14 with the actual URL
   - **Option B**: Rename the service in Render to match `flask-app-backend-dev`

### Step 4: Rebuild Services

Render should automatically rebuild when you push to the `dev` branch. If not:

1. **Backend**: Go to flask-app-backend-dev → Manual Deploy → Deploy latest commit
2. **Frontend**: Go to flask-app-frontend-dev → Manual Deploy → Deploy latest commit

**Important**: Deploy backend first, then frontend!

### Step 5: Verify Deployment

1. **Check Backend Health**:
   - Open: `https://flask-app-backend-dev.onrender.com/healthz`
   - Should return: `{"status": "ok"}`

2. **Check Backend Root**:
   - Open: `https://flask-app-backend-dev.onrender.com/`
   - Should return: `{"message": "Flask App Backend API", "status": "running", "version": "1.0"}`

3. **Check Backend Logs**:
   - Go to Render dashboard → flask-app-backend-dev → Logs
   - Look for: `🔐 CORS Configuration:`
   - Verify it shows: `Frontend URL: https://flask-app-frontend-dev.onrender.com`
   - Verify it shows: `Allowed Origins: ['https://flask-app-frontend-dev.onrender.com']`

4. **Check Frontend**:
   - Open browser console: `https://flask-app-frontend-dev.onrender.com`
   - Look for: `API Base URL configured as: https://flask-app-backend-dev.onrender.com/api`

## Troubleshooting

### If CORS errors persist:

1. **Check the actual backend URL**:
   ```bash
   # In browser console on frontend site:
   console.log(window.location.hostname);
   ```

2. **Verify CORS headers**:
   ```bash
   curl -H "Origin: https://flask-app-frontend-dev.onrender.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://flask-app-backend-dev.onrender.com/api/auth/me -v
   ```
   
   Should return:
   ```
   HTTP/1.1 204 No Content
   Access-Control-Allow-Origin: https://flask-app-frontend-dev.onrender.com
   Access-Control-Allow-Credentials: true
   ```

3. **Check backend logs for errors**:
   - Look for database connection errors
   - Look for missing environment variables
   - Look for Python errors during startup

### If backend URL is different:

If your backend URL is `flask-app-dev-70xj.onrender.com` instead of `flask-app-backend-dev.onrender.com`:

1. Update `frontend/src/api.js` line 14:
   ```javascript
   const backendUrl = 'https://flask-app-dev-70xj.onrender.com/api';
   ```

2. Rebuild frontend

### Common Issues:

1. **Database not connected**: Check `DATABASE_URL` environment variable
2. **JWT errors**: Check `JWT_SECRET_KEY` environment variable
3. **Rate limiting errors**: Redis might not be connected (check `REDIS_URL`)

## Verification Checklist

- [ ] Backend service is running and accessible
- [ ] Backend health check returns `{"status": "ok"}`
- [ ] Backend logs show correct CORS configuration
- [ ] Frontend console shows correct API URL
- [ ] Login requests succeed without CORS errors
- [ ] `/api/auth/me` endpoint works correctly
- [ ] No 404 errors in console
- [ ] No CORS errors in console

## Quick Test

After deployment, try this in the browser console on your frontend:

```javascript
fetch('https://flask-app-backend-dev.onrender.com/api/auth/me', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e));
```

Expected result:
- If logged in: User data
- If not logged in: 401 Unauthorized (but NO CORS error)

## Support

If you still see CORS errors after following this guide:

1. Check the backend logs in Render dashboard
2. Verify the exact backend URL from the Render dashboard
3. Make sure the frontend is using the correct backend URL
4. Check that all environment variables are set correctly

