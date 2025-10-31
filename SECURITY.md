# 🔒 Security Documentation

## Overview
This document outlines the security measures implemented in the Flask application, including authentication, authorization, rate limiting, and best practices for deployment.

---

## ✅ Security Features Implemented

### 1. **Authentication & Authorization**

#### JWT-Based Authentication
- All sensitive endpoints require JWT authentication via `@jwt_required()` decorator
- Tokens support both cookies (for web UI) and headers (for Chrome extension)
- Tokens include user ID, role, name, email, and mobile in claims

#### Protected Endpoints
- `/api/public/*` - All endpoints now require authentication
- `/api/candidates/*` - Users can only access their own candidates
- `/api/admin/*` - Requires admin role
- `/api/ai/map-fields` - Requires authentication to prevent abuse

#### Authorization Levels
1. **Admin**: Full access to all resources
2. **User**: Access to own candidates only
3. **Candidate**: Access to own profile only

### 2. **Rate Limiting**

#### Global Limits
- **200 requests per day** per IP address
- **50 requests per hour** per IP address

#### Endpoint-Specific Limits
- **Login endpoints**: 5 requests per minute (prevents brute force)
  - `/api/auth/login-admin`
  - `/api/auth/login-user`
  - `/api/auth/login-candidate`
  - `/api/auth/token-admin`
  - `/api/auth/token-user`

- **AI endpoint**: 20 requests per minute (prevents cost overruns)
  - `/api/ai/map-fields`

### 3. **CORS Configuration**

#### Development
Allows multiple localhost origins for development:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative port)
- Configured `FRONTEND_URL` from environment

#### Production
- **Only** allows the configured production frontend URL
- Blocks all other origins to prevent CSRF attacks

### 4. **Secret Key Validation**

#### Production Checks
The application **will not start** in production if:
- `SECRET_KEY` is set to default value `"dev-change-me"`
- `JWT_SECRET_KEY` is set to default value `"jwt-change-me"`
- `SECRET_KEY` is less than 32 characters
- `JWT_SECRET_KEY` is less than 32 characters

#### Generating Strong Secrets
```bash
# Generate strong random secrets
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Set these in your `.env` file or environment variables:
```bash
SECRET_KEY=your-strong-random-secret-here
JWT_SECRET_KEY=your-strong-random-jwt-secret-here
```

### 5. **Password Security**
- All user passwords hashed using `werkzeug.security` (bcrypt)
- Minimum password length: 6 characters
- Passwords never returned in API responses

### 6. **Input Validation**

#### User Creation/Update
- Email format validation
- Mobile number must be digits only
- Email and mobile uniqueness checks
- Password length validation (minimum 6 characters)

#### Candidate Creation/Update
- Required field validation
- Email format and uniqueness validation
- Phone number format validation (digits only)
- SSN uniqueness validation (global)
- SSN length validation (4-10 characters)

### 7. **SQL Injection Prevention**
- Using SQLAlchemy ORM throughout
- All queries use parameterized statements
- No raw SQL with user input

---

## 🚨 Production Deployment Checklist

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Security (MUST be changed from defaults!)
SECRET_KEY=<generate-strong-random-secret-32-chars-minimum>
JWT_SECRET_KEY=<generate-strong-random-secret-32-chars-minimum>

# Environment
FLASK_ENV=production  # IMPORTANT: Do not set to "development"

# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Optional
OPENAI_API_KEY=sk-...
```

### Security Checklist

- [ ] Set strong `SECRET_KEY` (32+ characters)
- [ ] Set strong `JWT_SECRET_KEY` (32+ characters)
- [ ] Set `FLASK_ENV=production` (not "development")
- [ ] Configure production `DATABASE_URL`
- [ ] Set correct `FRONTEND_URL` for CORS
- [ ] Enable HTTPS/TLS on your server
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable database encryption at rest
- [ ] Review and restrict database user permissions
- [ ] Set up monitoring and alerting
- [ ] Configure log retention policies
- [ ] Test rate limiting is working
- [ ] Verify CORS only allows your frontend
- [ ] Test that public endpoints require authentication

---

## 🔐 API Security

### Authentication Flow

#### Web UI (Cookie-based)
1. User logs in via `/api/auth/login-user` or `/api/auth/login-admin`
2. Server sets JWT in HTTP-only cookie
3. Subsequent requests automatically include cookie
4. Logout via `/api/auth/logout` clears cookie

#### Chrome Extension (Header-based)
1. User logs in via `/api/auth/token-user` or `/api/auth/token-admin`
2. Extension receives JWT token in response
3. Extension stores token in `chrome.storage.sync`
4. Extension sends token in `Authorization: Bearer <token>` header
5. Logout clears stored token

### Authorization Checks

#### User Endpoints
```python
@jwt_required()
def endpoint():
    uid = current_user_id()
    # Only return data owned by this user
    data = Model.query.filter_by(created_by_user_id=uid).all()
```

#### Admin Endpoints
```python
@jwt_required()
def admin_endpoint():
    require_admin()  # Checks role from JWT claims
    # Admin-only logic
```

---

## 🛡️ Rate Limiting Details

### Storage
- **Development**: In-memory storage (resets on restart)
- **Production**: Recommended to use Redis for distributed rate limiting

### Upgrading to Redis (Production)
```python
# In backend/app/__init__.py, change:
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"  # Use Redis in production
)
```

### Rate Limit Headers
Responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

---

## 📊 Security Monitoring

### Recommended Logging
- Failed login attempts
- Rate limit violations
- Authorization failures (403 errors)
- Unusual API usage patterns
- Database query errors

### Alerting Recommendations
- Multiple failed login attempts from same IP
- Rate limit exceeded frequently
- Unexpected spikes in API traffic
- Database connection failures
- High error rates (500 errors)

---

## 🔄 Updating Dependencies

Regularly update dependencies for security patches:

```bash
# Check for outdated packages
pip list --outdated

# Update specific package
pip install --upgrade package-name

# Regenerate requirements.txt
pip freeze > requirements.txt
```

### Security Scanning
```bash
# Install safety
pip install safety

# Scan for known vulnerabilities
safety check
```

---

## 📱 Chrome Extension Security

### Permissions
- Only requests access to production backend and local files
- No broad `http://*/*` or `https://*/*` permissions in production
- File access requires user to manually enable "Allow access to file URLs"

### Data Storage
- JWT tokens stored in `chrome.storage.sync` (encrypted by Chrome)
- User info stored alongside token
- Logout completely clears all stored data

### API Calls
- All API calls use HTTPS in production
- JWT token sent in Authorization header
- Tokens automatically expire (configurable in backend)

---

## ⚠️ Known Limitations & Future Improvements

### Current Limitations
1. **Candidate passwords**: Currently stored in plain text in database
   - **Impact**: If database compromised, candidate passwords exposed
   - **Fix Planned**: Hash candidate passwords like user passwords

2. **Rate limiting storage**: Using in-memory storage
   - **Impact**: Rate limits reset on server restart
   - **Fix Recommended**: Use Redis in production

3. **No request logging**: API requests not logged
   - **Impact**: Difficult to detect attacks or debug issues
   - **Fix Recommended**: Implement comprehensive logging

### Future Security Enhancements
- [ ] Implement 2FA for admin accounts
- [ ] Add request logging and audit trail
- [ ] Implement CSRF protection for cookie-based auth
- [ ] Add API versioning
- [ ] Implement rate limiting per user (not just per IP)
- [ ] Add webhook for security events
- [ ] Implement password reset functionality
- [ ] Add account lockout after failed login attempts
- [ ] Hash candidate passwords
- [ ] Add security headers (CSP, HSTS, X-Frame-Options, etc.)

---

## 📞 Security Contact

If you discover a security vulnerability, please email:
**security@datafyre.com**

Do not publicly disclose security vulnerabilities.

---

## 📄 License & Compliance

This application handles sensitive PII (Personally Identifiable Information):
- Names, emails, phone numbers
- Addresses, SSNs
- Work history, education
- Citizenship and visa status

Ensure compliance with relevant regulations:
- **GDPR** (if handling EU citizens' data)
- **CCPA** (if handling California residents' data)
- **SOC 2** (if required by clients)
- **HIPAA** (not applicable unless health data is added)

---

**Last Updated**: 2025-01-28  
**Version**: 1.0.0

