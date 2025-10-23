# Flask + React Candidate Management System

A full-stack web application for managing job candidates with AI-powered resume generation.

## 🚀 Features

- **User Management**: Admin panel for creating and managing users
- **Candidate Database**: Store and manage candidate information
- **Job Tracking**: Track job applications for each candidate
- **AI Resume Generation**: Automatically generate tailored resumes using OpenAI
- **Chrome Extension**: Auto-fill candidate data from web forms
- **JWT Authentication**: Secure authentication with cookie-based sessions
- **PostgreSQL Database**: Production-ready database (SQLite for local dev)

## 📁 Project Structure

```
flask-app/
├── backend/              # Flask REST API
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py     # Database models
│   │   ├── auth.py       # Authentication routes
│   │   ├── admin.py      # Admin routes
│   │   ├── candidates.py # Candidate routes
│   │   ├── ai.py         # AI form mapping
│   │   └── candidateresumebuilder.py  # Resume generation
│   ├── migrations/       # Database migrations
│   ├── config.py         # Configuration
│   ├── wsgi.py          # Application entry point
│   └── requirements.txt  # Python dependencies
│
├── frontend/             # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── api.js       # API client
│   │   └── main.jsx     # App entry point
│   └── package.json     # Node dependencies
│
├── extension/           # Chrome Extension
│   ├── manifest.json
│   ├── popup.html
│   ├── contentScript.js
│   └── background.js
│
└── RENDER_DEPLOYMENT_GUIDE.md  # Deployment instructions
```

## 🛠️ Technology Stack

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: ORM for database operations
- **Flask-JWT-Extended**: JWT authentication
- **PostgreSQL**: Production database
- **OpenAI API**: AI-powered resume generation
- **python-docx**: Word document generation

### Frontend
- **React**: UI library
- **Vite**: Build tool
- **Material-UI**: Component library
- **React Router**: Client-side routing

### Extension
- **Chrome Extension API**: Browser integration
- **Manifest V3**: Extension platform

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (for production) or SQLite (for local dev)
- OpenAI API key

## 🚀 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/flask-app.git
cd flask-app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
DATABASE_URL=sqlite:///app.db
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
OPENAI_API_KEY=your-openai-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Passw0rd!
ADMIN_MOBILE=9999999999
ADMIN_NAME=Administrator
EOL

# Run migrations
flask db upgrade

# Start backend server
python wsgi.py
```

Backend will be available at: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Chrome Extension Setup (Optional)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder

## 🔐 Default Credentials

**Admin Login:**
- Email: `admin@example.com`
- Password: `Passw0rd!` (or what you set in `.env`)

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/login-admin` - Admin login
- `POST /api/auth/login-user` - User login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Candidate Endpoints

- `GET /api/candidates` - List user's candidates
- `POST /api/candidates` - Create candidate
- `GET /api/candidates/:id` - Get candidate details
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

### Job Endpoints

- `GET /api/candidates/:id/jobs` - List candidate's jobs
- `POST /api/candidates/:id/jobs` - Add job
- `PUT /api/candidates/:id/jobs/:jobId` - Update job
- `DELETE /api/candidates/:id/jobs/:jobId` - Delete job

### Admin Endpoints

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/candidates` - List all candidates

### Resume Generation

- `POST /api/resume/generate` - Generate resume (requires job description and candidate info)

## 🌐 Deployment to Render

For detailed deployment instructions, see **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)**

### Quick Deployment Steps:

1. Push code to GitHub
2. Create PostgreSQL database on Render
3. Deploy Flask backend as Web Service
4. Deploy React frontend as Static Site
5. Configure environment variables
6. Run database migrations
7. Test deployment

**Estimated time**: 30-45 minutes

## 🔄 Database Migrations

### Create New Migration

```bash
cd backend
flask db migrate -m "Description of changes"
flask db upgrade
```

### Reset Database (Development Only)

```bash
# Delete database
rm instance/app.db

# Recreate with migrations
flask db upgrade
```

## 🧪 Testing

### Test Backend

```bash
cd backend
python -c "from app import create_app; app = create_app(); print('✓ Backend OK')"
```

### Test Database Connection

```bash
cd backend
python -c "from app import create_app; from app.models import User; app = create_app(); app.app_context().push(); print('Users:', User.query.count())"
```

### Test OpenAI API

```bash
cd backend
python -c "from openai import OpenAI; import os; client = OpenAI(api_key=os.getenv('OPENAI_API_KEY')); print('✓ OpenAI API OK')"
```

## 🐛 Troubleshooting

### Backend won't start

- Check Python version: `python --version` (should be 3.10+)
- Verify all dependencies: `pip install -r requirements.txt`
- Check `.env` file exists and has correct values

### Frontend won't start

- Check Node version: `node --version` (should be 18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist && npm run dev`

### Database errors

- SQLite: Delete `instance/app.db` and run `flask db upgrade`
- PostgreSQL: Check `DATABASE_URL` in `.env`
- Migrations: Check `migrations/versions/` for conflicting files

### CORS errors

- Verify frontend URL in `backend/app/__init__.py` CORS configuration
- Clear browser cookies and cache
- Try incognito/private mode

### JWT authentication errors

- Clear browser cookies
- Check `JWT_SECRET_KEY` hasn't changed
- Verify `credentials: "include"` in frontend API calls

## 📝 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `postgresql://user:pass@host/db` |
| `SECRET_KEY` | Flask secret key | Random 32-char string |
| `JWT_SECRET_KEY` | JWT signing key | Random 32-char string |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ADMIN_EMAIL` | Default admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Default admin password | `Passw0rd!` |
| `ADMIN_MOBILE` | Default admin mobile | `9999999999` |
| `ADMIN_NAME` | Default admin name | `Administrator` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

## 🔧 Configuration

### Switch from SQLite to PostgreSQL

1. Install PostgreSQL locally
2. Create database: `createdb flask_app_db`
3. Update `.env`: `DATABASE_URL=postgresql://postgres:password@localhost:5432/flask_app_db`
4. Run migrations: `flask db upgrade`
5. Restart backend

### Configure OpenAI Model

In `backend/app/candidateresumebuilder.py`, change:

```python
model="gpt-4o-mini"  # or "gpt-4", "gpt-3.5-turbo"
```

## 📊 Database Schema

### User Table
- `id`, `name`, `email`, `mobile`, `password_hash`, `role`

### Candidate Table
- Personal info (name, email, phone, birthdate, gender)
- Immigration (nationality, citizenship, visa, work authorization)
- Address (line1, line2, city, state, postal_code, country)
- Professional (skills, experience, education, certificates)
- Preferences (willing to relocate/travel, disability status)

### CandidateJob Table
- `id`, `candidate_id`, `job_id`, `job_description`, `resume_content`

## 🎨 Customization

### Change Theme Colors

Edit `frontend/src/index.css` or Material-UI theme in `main.jsx`

### Add New Fields to Candidate Form

1. Update model in `backend/app/models.py`
2. Create migration: `flask db migrate`
3. Update form in `frontend/src/components/CandidateForm.jsx`
4. Update API in `backend/app/candidates.py`

### Modify Resume Template

Edit `backend/app/candidateresumebuilder.py` → `create_resume_docx()` function

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open pull request

## 📄 License

This project is for educational purposes. Modify as needed for your use case.

## 🆘 Support

For deployment issues, see [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)

For bugs or feature requests, open an issue on GitHub.

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Render Documentation](https://render.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Happy Coding!** 🚀

*Last Updated: October 23, 2025*
