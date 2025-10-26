# Data Fyre - Candidate Management System

> AI-powered candidate management platform with intelligent form autofill capabilities

## 🚀 Quick Links

- **[Developer Documentation](DEVELOPER_README.md)** - Understand the codebase, architecture, and how to contribute
- **[Deployment Guide](DEPLOYMENT_README.md)** - Deploy the application to production (Render)

## 📖 Overview

Data Fyre is a comprehensive candidate management system designed to streamline the job application process. The platform consists of three integrated components:

### 🖥️ Backend (Flask API)
- RESTful API built with Flask and PostgreSQL
- Multi-role authentication (Admin, User, Candidate)
- AI-powered resume generation using OpenAI GPT-4
- Comprehensive candidate data management

### 🎨 Frontend (React)
- Modern React application with Material-UI
- Intuitive dashboards for all user roles
- Real-time form validation
- Responsive design

### 🔌 Chrome Extension
- One-click form autofill for job applications
- AI-powered field mapping
- Works on any website
- Automatic backend detection

## ✨ Key Features

- **Multi-Role Access Control** - Admin, User, and Candidate portals
- **AI Resume Generation** - Tailored resumes for each job application using GPT-4
- **Smart Autofill** - Chrome extension with intelligent form field mapping
- **Candidate Tracking** - Comprehensive candidate profiles with job history
- **Database Migrations** - Version-controlled schema changes
- **RESTful API** - Clean, well-documented API endpoints
- **Secure Authentication** - JWT-based auth with cookies and headers support

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Client Applications              │
├─────────────┬────────────┬──────────────┤
│   React     │  Chrome    │  API Clients │
│   Frontend  │  Extension │              │
└──────┬──────┴──────┬─────┴──────┬───────┘
       │             │            │
       └─────────────┼────────────┘
                     │
              ┌──────▼──────┐
              │  Flask API  │
              │  (Backend)  │
              └──────┬──────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐     ┌──────▼──────┐  ┌─────▼─────┐
│ PostgreSQL   │  OpenAI API │  │  File     │
│ Database │   │   (GPT-4)   │  │  System   │
└──────────┘   └─────────────┘  └───────────┘
```

## 🛠️ Tech Stack

**Backend:**
- Python 3.11
- Flask 3.0.3
- PostgreSQL
- SQLAlchemy
- OpenAI API
- JWT Authentication

**Frontend:**
- React 19.1.1
- Vite
- Material-UI
- React Router

**Extension:**
- JavaScript (Manifest V3)
- Chrome APIs

## 📚 Documentation Structure

### For Developers (New to the Project)
👉 **Start here:** [DEVELOPER_README.md](DEVELOPER_README.md)

Learn about:
- Complete architecture overview
- Backend structure and API endpoints
- Frontend components and routing
- Chrome extension functionality
- Database schema
- Local development setup
- Code style guidelines

### For Deployment (DevOps/Production)
👉 **Start here:** [DEPLOYMENT_README.md](DEPLOYMENT_README.md)

Learn about:
- Step-by-step deployment to Render
- Environment configuration
- Database setup
- Chrome Web Store publishing
- Monitoring and maintenance
- Troubleshooting common issues
- Security best practices

## 🚦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- OpenAI API key

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flask-app
   ```

2. **Set up Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Create .env file with your config
   flask db upgrade
   flask run
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Install Extension**
   - Open Chrome → `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension` folder

📖 **For detailed setup instructions, see [DEVELOPER_README.md](DEVELOPER_README.md#development-setup)**

## 🌐 Live Demo

**Backend API:** `https://flask-app-r5xw.onrender.com/api`  
**Health Check:** `https://flask-app-r5xw.onrender.com/api/healthz`

## 📦 Project Structure

```
flask-app/
├── backend/                 # Flask API
│   ├── app/                # Application modules
│   │   ├── __init__.py     # App factory
│   │   ├── models.py       # Database models
│   │   ├── auth.py         # Authentication
│   │   ├── admin.py        # Admin routes
│   │   ├── candidates.py   # Candidate CRUD
│   │   ├── ai.py           # AI field mapping
│   │   ├── candidateresumebuilder.py  # Resume generation
│   │   └── public.py       # Public API
│   ├── migrations/         # Database migrations
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Python dependencies
│   └── wsgi.py            # WSGI entry point
│
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── utils/         # Utility functions
│   │   ├── api.js         # API client
│   │   └── AuthContext.jsx # Auth state
│   ├── package.json
│   └── vite.config.js
│
├── extension/              # Chrome extension
│   ├── manifest.json      # Extension config
│   ├── popup.html         # Extension UI
│   ├── popup.js           # Extension logic
│   └── content.js         # Form detection/filling
│
├── DEVELOPER_README.md     # Developer documentation
├── DEPLOYMENT_README.md    # Deployment guide
└── README.md              # This file
```

## 🔑 Default Credentials

**Admin Login:**
- Email: `admin@example.com`
- Password: `Passw0rd!`

⚠️ **Change these credentials immediately after first deployment!**

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

### Extension
1. Load extension in Chrome
2. Navigate to any job application form
3. Click extension icon
4. Select user and candidate
5. Click "Autofill" to test

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention via SQLAlchemy ORM
- HTTPS enforcement in production
- Environment variable configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
```
POST /api/auth/login-admin      # Admin login
POST /api/auth/login-user       # User login
POST /api/auth/login-candidate  # Candidate login
GET  /api/auth/me              # Get current user
POST /api/auth/logout          # Logout
```

### Candidate Endpoints
```
GET    /api/candidates              # List my candidates
POST   /api/candidates              # Create candidate
GET    /api/candidates/:id          # Get candidate
PUT    /api/candidates/:id          # Update candidate
DELETE /api/candidates/:id          # Delete candidate
GET    /api/candidates/:id/jobs     # List jobs
POST   /api/candidates/:id/jobs     # Add job
```

### AI & Resume Endpoints
```
POST /api/ai/map-fields    # AI field mapping
POST /api/resume/generate  # Generate resume
```

📖 **For complete API documentation, see [DEVELOPER_README.md](DEVELOPER_README.md#api-endpoints)**

## 🐛 Troubleshooting

**Common Issues:**

- **Backend won't start** → Check `DATABASE_URL` in `.env`
- **Frontend can't connect** → Verify `VITE_API_URL` 
- **Extension not working** → Check host permissions in `manifest.json`
- **CORS errors** → Update `FRONTEND_URL` in backend config

📖 **For detailed troubleshooting, see [DEPLOYMENT_README.md](DEPLOYMENT_README.md#troubleshooting)**

## 📊 Database Schema

**Core Tables:**
- `user` - Admin and regular users
- `candidate` - Candidate profiles
- `candidate_job` - Job applications per candidate

📖 **For detailed schema, see [DEVELOPER_README.md](DEVELOPER_README.md#database-schema)**

## 🚀 Deployment

**Recommended Platform:** Render (Free tier available)

**Quick Deploy:**
1. Create PostgreSQL database on Render
2. Deploy backend as Web Service
3. Deploy frontend as Static Site
4. Install/publish Chrome extension

📖 **For step-by-step deployment guide, see [DEPLOYMENT_README.md](DEPLOYMENT_README.md)**

## 📄 License

This project is proprietary software of Data Fyre Pvt. Ltd.

## 📧 Support

For issues or questions:
- Check documentation: [DEVELOPER_README.md](DEVELOPER_README.md) or [DEPLOYMENT_README.md](DEPLOYMENT_README.md)
- Review troubleshooting sections
- Contact: support@datafyre.com

## 🎯 Roadmap

- [ ] Email notifications for job applications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile application
- [ ] Integration with LinkedIn API
- [ ] Bulk candidate import/export
- [ ] Custom resume templates
- [ ] Interview scheduling

---

**Built with ❤️ by Data Fyre Pvt. Ltd.**

Last Updated: October 2025

