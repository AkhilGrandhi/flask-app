# 🔒 Security Updates - Installation & Testing Guide

## Changes Made

This update implements critical security improvements to protect your application from unauthorized access and abuse.

---

## 📋 Summary of Changes

### Backend Changes
1. ✅ **Protected Public Endpoints** - All `/api/public/*` endpoints now require authentication
2. ✅ **Protected AI Endpoint** - `/api/ai/map-fields` now requires authentication
3. ✅ **Added Rate Limiting** - Prevents brute force attacks and API abuse
4. ✅ **Fixed CORS** - Production now only allows configured frontend
5. ✅ **Secret Validation** - App won't start with weak secrets in production
6. ✅ **Authorization Checks** - Users can only access their own data

### Extension Changes
1. ✅ **Updated API calls** - All calls now send JWT authentication token
2. ✅ **Backend detection** - Uses `/api/healthz` endpoint (doesn't require auth)
3. ✅ **Default auth enabled** - All API calls authenticated by default

### Frontend Changes
- ✅ **No changes needed** - Already uses proper cookie-based authentication

---

## 🚀 Installation Steps

### 1. Install New Dependencies

```bash
cd backend
pip install Flask-Limiter==3.5.0
```

Or reinstall all dependencies:
```bash
pip install -r requirements.txt
```

### 2. Generate Strong Secrets (CRITICAL for Production)

```bash
# Generate SECRET_KEY
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"

# Generate JWT_SECRET_KEY
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

Copy the generated values to your `.env` file:

```bash
# backend/.env
SECRET_KEY=your-generated-secret-key-here
JWT_SECRET_KEY=your-generated-jwt-secret-here
FLASK_ENV=production  # Set to production
```

### 3. Restart Backend

```bash
cd backend
python run.py
```

**Expected Output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: off
```

If you see security errors, it means your secrets are not configured correctly.

### 4. Update Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Click the **reload icon** on your "Data Fyre - Candidate Autofill" extension
3. Open the extension popup
4. You should see the login screen

### 5. Clear Extension Storage (Important!)

The extension now requires authentication, so old data must be cleared:

1. Right-click the extension icon → **Inspect popup**
2. In the console, run:
   ```javascript
   chrome.storage.sync.clear()
   ```
3. Close and reopen the extension

---

## 🧪 Testing Checklist

### Backend Testing

#### Test 1: API Health Check (Unauthenticated)
```bash
curl http://localhost:5000/api/healthz
```
✅ Expected: `{"status":"ok"}`

#### Test 2: Public Endpoints Require Auth
```bash
curl http://localhost:5000/api/public/users
```
✅ Expected: `{"msg":"Missing Authorization Header"}` (401 error)

#### Test 3: Login Works
```bash
curl -X POST http://localhost:5000/api/auth/token-user \
  -H "Content-Type: application/json" \
  -d '{"mobile":"8309441792","password":"your-password"}'
```
✅ Expected: `{"access_token":"eyJ...","role":"user"}`

#### Test 4: Authenticated Request Works
```bash
# Replace YOUR_TOKEN with token from Test 3
curl http://localhost:5000/api/public/candidates \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Expected: JSON array of your candidates

#### Test 5: Rate Limiting Works
Run the login command 6 times in a row:
```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/token-user \
    -H "Content-Type: application/json" \
    -d '{"mobile":"8309441792","password":"wrong"}';
  echo ""
done
```
✅ Expected: First 5 fail with 401, 6th returns 429 (Too Many Requests)

### Frontend Testing

1. **Open Web UI**: `http://localhost:5173`
2. **Login** with valid credentials
3. **Navigate** to candidates page
4. ✅ You should see your candidates
5. **Try creating/editing** a candidate
6. ✅ Should work normally

### Extension Testing

1. **Open Chrome** and click the extension icon
2. **Login Screen**:
   - Enter mobile: `8309441792`
   - Enter password
   - Click "Login"
   
3. ✅ **After Login**:
   - Should see your name and mobile number
   - Should see dropdown with YOUR candidates only
   
4. **Test Autofill**:
   - Open a test form (e.g., `file:///path/to/your/form.html`)
   - Make sure "Allow access to file URLs" is enabled
   - Select a candidate
   - Click "Autofill Form"
   - ✅ Form should fill automatically

5. **Test Logout**:
   - Click the 🚪 button
   - ✅ Should return to login screen
   - Extension should remember login on next open

---

## 🐛 Troubleshooting

### Problem: Backend won't start

**Error**: `RuntimeError: SECURITY ERROR: SECRET_KEY must be set`

**Solution**: 
- Check your `.env` file has `SECRET_KEY` and `JWT_SECRET_KEY`
- Set `FLASK_ENV=development` for local testing
- For production, generate strong secrets (see Step 2 above)

### Problem: Extension shows "No candidates found"

**Possible Causes**:
1. You're not logged in - Solution: Clear storage and login again
2. You have no candidates - Solution: Create candidates via web UI first
3. Token expired - Solution: Logout and login again

**Debug Steps**:
1. Right-click extension → Inspect
2. Check console for errors
3. Look for logs like:
   ```
   [popup] Current user ID: 5
   [popup] Total candidates: 10
   [popup] Filtered candidates for user: 3
   ```

### Problem: Frontend shows errors

**Error**: `Failed to fetch` or CORS errors

**Solution**:
- Check backend is running
- Check `FRONTEND_URL` environment variable matches your frontend URL
- For local dev, set `FLASK_ENV=development`

### Problem: Rate limit errors

**Error**: `429 Too Many Requests`

**Solution**:
- Wait 1 minute before trying again
- This is working as intended - prevents brute force attacks
- For development testing, you can temporarily increase limits in `backend/app/__init__.py`

---

## 🔄 Rollback Instructions

If you need to rollback these changes:

```bash
# Backend
cd backend
git checkout HEAD~1 backend/app/

# Extension
cd extension
git checkout HEAD~1 extension/

# Then reload backend and extension
```

---

## 📊 What Changed in Each File

### Backend Files Modified
- ✅ `backend/requirements.txt` - Added Flask-Limiter
- ✅ `backend/config.py` - Added secret validation
- ✅ `backend/app/__init__.py` - Added rate limiting, fixed CORS
- ✅ `backend/app/public.py` - Added @jwt_required() to all endpoints
- ✅ `backend/app/ai.py` - Added @jwt_required() and rate limiting
- ✅ `backend/app/auth.py` - Added rate limiting to login endpoints

### Extension Files Modified
- ✅ `extension/manifest.json` - Added file:// permission
- ✅ `extension/popup.js` - Made authentication default for all API calls

### Documentation Added
- ✅ `SECURITY.md` - Complete security documentation
- ✅ `SECURITY_UPDATE_GUIDE.md` - This file

---

## ✅ Verification

Once you've completed all testing, verify:

- [ ] Backend starts without errors
- [ ] Web UI login works
- [ ] Web UI shows candidates correctly
- [ ] Extension login works
- [ ] Extension shows only your candidates
- [ ] Extension autofill works
- [ ] Rate limiting prevents spam
- [ ] Logout works in both web and extension

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the console logs (backend terminal, browser console, extension console)
2. Verify all environment variables are set correctly
3. Ensure you've cleared old extension storage
4. Try in incognito mode to rule out browser cache issues

---

## 🎉 Success Criteria

Your update is successful when:

1. ✅ Backend starts without security warnings
2. ✅ All authentication works (web + extension)
3. ✅ Users can only see their own data
4. ✅ Rate limiting prevents brute force
5. ✅ Extension autofill works as before
6. ✅ No functionality is broken

---

**Happy securing! 🔒**

