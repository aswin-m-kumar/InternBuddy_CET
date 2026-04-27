# InternBuddy CET

> AI-powered internship assistant for students at College of Engineering Trivandrum

![Status](https://img.shields.io/badge/status-production-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![Node](https://img.shields.io/badge/node-20+-green)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Local Development](#local-development)
  - [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🎯 Overview

InternBuddy CET is a full-stack web application that helps students discover, analyze, and apply for internships efficiently. It combines AI-powered text extraction, resume matching, and deadline tracking in a streamlined interface.

**Key Capabilities:**

- Extract internship details from URLs, text, or image/PDF posters
- Match resumes to internship requirements with skill gap analysis
- Track application deadlines with expiration alerts
- Save favorite internships to a personal collection
- Cost-conscious operation with intelligent caching and rate limiting

**Live Demo:** [InternBuddy on GitHub Pages](https://aswin-m-kumar.github.io/InternBuddy_CET/)

---

## ✨ Features

### 1. Internship Summarization

- **URL Scraping**: Extract internship details from LinkedIn and company career pages
- **Text Extraction**: Parse raw text from emails, WhatsApp, or social media
- **Image/PDF Upload**: OCR and extract text from campus posters and documents
- **AI Extraction**: NVIDIA NIM LLMs identify title, company, skills, duration, stipend, eligibility
- **Confidence Scoring**: Grounding score indicates extraction quality
- **Smart Caching**: Avoids re-summarizing duplicate URLs

### 2. Resume-to-Internship Matching

- **PDF Upload**: Parse resume to extract education, skills, experience, projects
- **Compatibility Analysis**: AI compares resume against internship requirements
- **Skill Mapping**: Identifies matched skills and critical gaps
- **Eligibility Assessment**: Checks against stated eligibility criteria
- **Score & Recommendation**: 0-100 score with Strong/Moderate/Weak classification
- **Rate Limiting**: 3/hour per IP (prevents abuse)

### 3. Deadline Management

- **Detection**: Extracts deadline from internship description
- **Classification**: Tags as expired, expiring soon, rolling, or no deadline
- **Year Assumption**: Auto-assumes year if not explicit; flags for user verification
- **Alerts**: Visual warnings for passed deadlines and time-sensitive opportunities

### 4. User Accounts & Collections

- **Local Auth**: Email/password signup and signin with bcrypt hashing
- **Google OAuth**: One-click Google sign-in with profile sync
- **Personal Collection**: Save favorite internships for later review
- **Resume Profile**: Store parsed resume data for quick matching

### 5. Admin & Analytics

- **Usage Tracking**: Logs API calls, model usage, cache hits/misses
- **Admin Dashboard**: `/api/admin/usage` endpoint with usage metrics
- **Rate Limiting**: Per-endpoint limits to protect backend

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19 with Vite 8 (lightning-fast HMR)
- **Styling**: Tailwind CSS + custom accent tokens
- **UI Effects**: Shader-based animated gradients (`@shadergradient/react`)
- **Routing**: Hash-based routing (`#dashboard`, `#landing`)
- **State**: React hooks (minimal dependency footprint)
- **Build**: Vite with chunk-size optimization warnings

### Backend

- **Framework**: Flask + SQLAlchemy ORM
- **Authentication**: Flask-Login, Flask-Session, Google OAuth 2.0
- **Security**: CSRF protection, rate limiting, security headers
- **AI**: NVIDIA NIM (OpenAI-compatible API)
- **File Processing**: pdfplumber, PyPDF2, OCR.Space API, Pillow
- **Web Scraping**: cloudscraper (anti-bot handling)
- **Database**: SQLite (local), PostgreSQL (production)

### Infrastructure

- **Frontend Hosting**: Vercel (GitHub Pages fallback)
- **Backend Hosting**: Vercel Serverless Functions
- **Database**: Neon PostgreSQL (production) / SQLite (local)
- **CI/CD**: GitHub Actions
- **DNS/CDN**: Cloudflare

### Key Dependencies

```
flask, flask-cors, flask-limiter, flask-sqlalchemy
google-auth-oauthlib, python-dotenv, pydantic
pdfplumber, pillow, beautifulsoup4, cloudscraper
openai (NVIDIA endpoint), requests
```

---

## 🏗️ Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                             │
│  React App (Vite) - Hash-based routing                      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS + CSRF Token
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 Vercel Edge Network                           │
│  • CORS handling (explicit origin allowlist)                │
│  • Rate limiting (in-memory local, Redis in production)     │
│  • Security headers injection                               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Flask Backend (Vercel Serverless)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Auth Layer                                           │  │
│  │ • Session management (httpOnly cookies)             │  │
│  │ • CSRF token validation                             │  │
│  │ • Google OAuth callback                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Business Logic                                       │  │
│  │ • Job scraper (LinkedIn, anti-bot)                  │  │
│  │ • Resume parser (PDF extraction)                    │  │
│  │ • LLM integration (NVIDIA NIM)                      │  │
│  │ • Deadline detection & parsing                      │  │
│  │ • Eligibility scoring                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Data Layer (SQLAlchemy ORM)                         │  │
│  │ • Users, Internships, SavedInternships             │  │
│  │ • AuthCredentials, Applications, UsageLogs         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │ Neon   │  │NVIDIA  │  │OCR Space │
    │Postgres│  │ NIM    │  │   API    │
    └────────┘  └────────┘  └──────────┘
```

### Data Flow

1. **Summarization**: URL/text/file → scraper/parser → LLM extraction → DB storage → cache (24h TTL)
2. **Matching**: Resume PDF → parser → resume data → LLM compatibility analysis → score/recommendations
3. **Auth Flow**: Sign-in → CSRF token generation → session cookie → protected route access

---

## 🚀 Getting Started

### Local Development

#### Prerequisites

- Python 3.10+
- Node.js 20+
- npm 10+
- Git

#### Setup

1. **Clone repository**

```bash
git clone https://github.com/aswin-m-kumar/InternBuddy_CET.git
cd InternBuddy_CET
```

2. **Setup Python environment**

```bash
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment**

```bash
# Copy .env.example to .env (if exists) or create .env
cat > .env << 'EOF'
SECRET_KEY=dev-secret-key-for-local-only
DATABASE_URL=sqlite:///internbuddy.db
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
RATELIMIT_STORAGE_URI=memory://
NVIDIA_API_KEY=your-nvidia-api-key-here
OCR_SPACE_API_KEY=your-ocr-space-api-key-here
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
SUMMARIZATION_MODEL=meta/llama-3.1-8b-instruct
ANALYSIS_MODEL=meta/llama-3.1-70b-instruct
ADMIN_KEY=local-admin-key
FRONTEND_URL=http://localhost:5173
EOF
```

5. **Start backend**

```bash
python app.py
# Backend runs at http://127.0.0.1:5000
```

6. **In another terminal, start frontend**

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

7. **Access the app**

- Open http://localhost:5173
- Backend API available at http://127.0.0.1:5000/api

---

### Production Deployment

#### A) Backend on Vercel

1. **Connect repository to Vercel**
   - Import repo from GitHub
   - Set root directory to `.`

2. **Configure environment variables** in Vercel Project Settings:

   ```
   SECRET_KEY=<strong-random-key-min-32-chars>
   DATABASE_URL=postgresql://user:password@host/dbname
   RATELIMIT_STORAGE_URI=redis://host:port
   NVIDIA_API_KEY=<your-api-key>
   OCR_SPACE_API_KEY=<your-api-key>
   ALLOWED_ORIGINS=https://aswin-m-kumar.github.io
   SUMMARIZATION_MODEL=meta/llama-3.1-8b-instruct
   ANALYSIS_MODEL=meta/llama-3.1-70b-instruct
   ADMIN_KEY=<strong-random-key>
   FRONTEND_URL=https://aswin-m-kumar.github.io/InternBuddy_CET
   ```

3. **Deploy**
   - Vercel auto-deploys on push to main
   - Copy backend URL (e.g., `https://intern-buddy-cet.vercel.app`)

#### B) Frontend on GitHub Pages

1. **Add secrets to GitHub repo** (Settings → Secrets and variables):

   ```
   VITE_API_URL=https://intern-buddy-cet.vercel.app
   ```

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Set source to GitHub Actions
   - Ensure `.github/workflows/deploy.yml` exists

3. **Deploy**
   - Push to main branch
   - GitHub Actions workflow builds and deploys automatically
   - Site available at: https://aswin-m-kumar.github.io/InternBuddy_CET/

#### Database Setup (PostgreSQL on Neon)

1. Create free PostgreSQL database on [Neon.tech](https://neon.tech)
2. Copy connection string
3. Set `DATABASE_URL` in Vercel with connection string
4. Backend auto-migrates on first run

#### Cache & Rate Limiting (Redis on Upstash)

1. Create free Redis database on [Upstash.com](https://upstash.com)
2. Copy Redis URL
3. Set `RATELIMIT_STORAGE_URI` in Vercel with Redis URL

---

## ⚙️ Configuration

### Environment Variables

#### Required (Backend)

| Variable         | Purpose                                          | Example                                          |
| ---------------- | ------------------------------------------------ | ------------------------------------------------ |
| `SECRET_KEY`     | Flask session encryption key (>32 chars in prod) | `<random-string>`                                |
| `DATABASE_URL`   | Database connection string                       | `sqlite:///internbuddy.db` or `postgresql://...` |
| `NVIDIA_API_KEY` | AI model API key                                 | `nvapi-...`                                      |

#### Optional (Backend)

| Variable                | Purpose                                   | Default                               |
| ----------------------- | ----------------------------------------- | ------------------------------------- |
| `PORT`                  | Backend server port                       | `5000`                                |
| `ALLOWED_ORIGINS`       | CORS origins (comma-separated)            | `http://localhost:5173`               |
| `RATELIMIT_STORAGE_URI` | Rate limiter backend                      | `memory://`                           |
| `LLM_BASE_URL`          | AI API base URL                           | `https://integrate.api.nvidia.com/v1` |
| `SUMMARIZATION_MODEL`   | Model for internship extraction           | `meta/llama-3.1-8b-instruct`          |
| `ANALYSIS_MODEL`        | Model for resume matching                 | `meta/llama-3.1-70b-instruct`         |
| `OCR_SPACE_API_KEY`     | OCR service API key (free tier available) | (optional)                            |
| `ADMIN_KEY`             | Header key for admin endpoints            | (required for `/api/admin/usage`)     |
| `FRONTEND_URL`          | OAuth redirect and CORS origin            | `http://localhost:5173`               |

#### Frontend (Build-time)

| Variable       | Purpose                                   |
| -------------- | ----------------------------------------- |
| `VITE_API_URL` | Backend API base URL for production build |

---

## 📡 API Reference

### Authentication Endpoints

#### `GET /api/auth/csrf`

Fetch fresh CSRF token for session.

```bash
curl -X GET http://localhost:5000/api/auth/csrf \
  -H "Cookie: internbuddy_session=..." \
  -c cookies.txt
```

**Response:**

```json
{
  "success": true,
  "csrf_token": "..."
}
```

#### `POST /api/auth/signup`

Create new local account.

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Doe","email":"john@example.com","password":"Pass123!"}'
```

**Response:**

```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "provider": "local",
    "has_resume": false
  }
}
```

#### `POST /api/auth/signin`

Sign in with email & password.

```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Pass123!"}'
```

**Response:** Same as signup

#### `GET /api/auth/me`

Check authentication status.

```bash
curl -X GET http://localhost:5000/api/auth/me -c cookies.txt
```

**Response (authenticated):**

```json
{
  "authenticated": true,
  "user": { ... },
  "csrf_token": "..."
}
```

**Response (not authenticated):**

```json
{
  "authenticated": false,
  "user": null
}
```

#### `POST /api/auth/signout`

Clear session and sign out.

```bash
curl -X POST http://localhost:5000/api/auth/signout \
  -H "X-CSRF-Token: ..." \
  -c cookies.txt
```

**Response:**

```json
{
  "success": true,
  "message": "Signed out"
}
```

---

### Internship Endpoints

#### `POST /api/internships/summarize`

Summarize internship from URL or text.

```bash
curl -X POST http://localhost:5000/api/internships/summarize \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: ..." \
  -c cookies.txt \
  -d '{
    "input_type": "url",
    "input": "https://www.linkedin.com/jobs/view/..."
  }'
```

**Response:**

```json
{
  "success": true,
  "internship_id": 42,
  "summary": {
    "title": "Software Engineer Intern",
    "company": "TechCorp",
    "role_summary": "Build backend APIs...",
    "skills": ["Python", "Flask", "SQL"],
    "stipend": "₹50,000/month",
    "location": "Bangalore",
    "duration": "6 months",
    "source_url": "https://...",
    "confidence_score": 94
  }
}
```

#### `POST /api/internships/summarize-file`

Summarize from uploaded poster/PDF.

```bash
curl -X POST http://localhost:5000/api/internships/summarize-file \
  -H "X-CSRF-Token: ..." \
  -c cookies.txt \
  -F "file=@poster.pdf"
```

#### `GET /api/internships`

List all internships with eligibility scoring.

```bash
curl -X GET "http://localhost:5000/api/internships?q=data&location=hyderabad" \
  -H "X-CSRF-Token: ..." \
  -c cookies.txt
```

**Query params:** `q` (search), `location`, `source`

#### `GET /api/internships/<id>`

Get single internship details.

#### `POST /api/internships/<id>/save`

Save internship to collection.

#### `DELETE /api/internships/<id>/save`

Unsave internship.

#### `GET /api/saved`

List saved internships.

---

### Resume Endpoints

#### `POST /api/resume/upload`

Upload and parse resume PDF.

```bash
curl -X POST http://localhost:5000/api/resume/upload \
  -H "X-CSRF-Token: ..." \
  -c cookies.txt \
  -F "file=@resume.pdf"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "education": ["B.Tech CSE, Anna University"],
    "skills": ["Python", "JavaScript", "React"],
    "experience": ["...", "..."],
    "projects": ["...", "..."]
  }
}
```

#### `GET /api/resume`

Get parsed resume data.

#### `POST /api/resume/analyze`

Analyze resume against internship.

```bash
curl -X POST http://localhost:5000/api/resume/analyze \
  -H "X-CSRF-Token: ..." \
  -c cookies.txt \
  -F "resume=@resume.pdf" \
  -F "url=https://linkedin.com/jobs/view/..."
```

**Response:**

```json
{
  "success": true,
  "internship": { ... },
  "deadline": { "parsed": "2026-05-15", "expired": false, "days_remaining": 32 },
  "analysis": {
    "score": 82,
    "recommendation": "Strong Match",
    "matched_skills": ["Python", "Flask"],
    "missing_skills": ["Kubernetes"],
    "eligibility_met": true,
    "strengths": ["...", "..."],
    "gaps": ["...", "..."]
  }
}
```

---

### Admin Endpoints

#### `GET /api/admin/usage`

Get API usage statistics (requires `X-Admin-Key` header).

```bash
curl -X GET http://localhost:5000/api/admin/usage \
  -H "X-Admin-Key: your-admin-key"
```

**Response:**

```json
[
  {
    "endpoint": "/api/internships/summarize",
    "total_calls": 1542,
    "cached_calls": 412,
    "cache_hit_rate": "26.7%",
    "total_tokens": 284521
  }
]
```

---

## 🔒 Security

### Authentication & Authorization

- ✅ Server-side session cookies (`httpOnly`, `Secure`, `SameSite`)
- ✅ 30-day persistent session lifetime
- ✅ Protected endpoints enforce authenticated user verification
- ✅ Automatic session restoration on app load
- ✅ Google OAuth 2.0 with granular error handling

### CSRF Protection

- ✅ Tokens issued on `/api/auth/csrf` and auth responses
- ✅ All mutations (POST/PUT/DELETE) require `X-CSRF-Token` header
- ✅ Tokens refreshed on each authentication action
- ✅ Frontend `apiFetch` helper automatically injects token

### Input Validation

- ✅ Email format validation
- ✅ Password strength requirements (8+ chars)
- ✅ File upload size limits (5MB resume, 8MB posters)
- ✅ File type validation (PDF, PNG, JPG, WEBP)

### Infrastructure Hardening

- ✅ Strong `SECRET_KEY` enforcement in production
- ✅ Distributed rate-limit storage (Redis/Valkey) in production
- ✅ HTTPS only (enforced via HSTS header)
- ✅ Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`
- ✅ `Cache-Control: no-store` on all API responses

### SSRF Mitigation

- ✅ DNS-based private IP detection
- ✅ Hostname resolution validation
- ✅ Explicit global-IP-only filtering
- ✅ Redirect-by-redirect validation (max 5 hops)
- ✅ Supports public web (no domain allowlist)

---

## 🐛 Troubleshooting

### Authentication Issues

**"401 AUTH_REQUIRED" on protected endpoints**

- User is not signed in
- Check `/api/auth/me` returns `authenticated: true`
- Try signing in again or refreshing OAuth session

**"403 CSRF_TOKEN_MISSING" or "CSRF_TOKEN_INVALID"**

- Frontend must fetch CSRF token via `/api/auth/csrf`
- Session may have expired (refresh page)
- Check browser allows third-party cookies

**"Session lost after page refresh"**

- Browser cookie settings may block session cookies
- Verify CORS config includes `allow_credentials: true`
- Check `ALLOWED_ORIGINS` includes exact frontend origin

### API Issues

**"CORS error on production"**

- Ensure `ALLOWED_ORIGINS` includes GitHub Pages URL
- Example: `ALLOWED_ORIGINS=https://aswin-m-kumar.github.io`

**"Rate limit exceeded (429)"**

- `/api/internships/summarize`: 10/hour
- `/api/resume/analyze`: 3/hour, 1/minute
- Wait before retrying

**"LinkedIn blocked" error**

- Anti-bot detection triggered
- Use "Pasted details" or upload mode instead
- Error code: `LINKEDIN_BLOCKED`

### File Processing

**"Could not extract text from PDF"**

- PDF may be scanned image (no OCR)
- Try uploading a native PDF
- Set `OCR_SPACE_API_KEY` for image-based PDFs

**"Resume analyze disabled in UI"**

- No resume uploaded yet
- No internship selected
- User not signed in
- Upload PDF and try again

### Database Issues

**"SQLite database locked"**

- Another process is writing
- Wait a few seconds, then retry
- Consider PostgreSQL for production

---

## 💻 Development

### Running Tests

```bash
# Backend syntax check
python -m py_compile app.py job_scraper.py models.py resume_parser.py deadline_utils.py

# Frontend lint
cd frontend && npm run lint

# Frontend build
cd frontend && npm run build
```

### Project Structure

```
InternBuddy_CET/
├── app.py                    # Flask main app, routes, business logic
├── models.py                 # SQLAlchemy ORM models
├── job_scraper.py            # Scraping, LLM extraction, SSRF checks
├── resume_parser.py          # PDF parsing, extraction
├── matcher.py                # Eligibility scoring
├── deadline_utils.py         # Deadline parsing & detection
├── requirements.txt          # Python dependencies
├── vercel.json              # Vercel serverless config
├── .env.example             # Environment template
│
├── api/
│   └── index.py             # Vercel serverless function entry
│
├── frontend/
│   ├── index.html           # HTML template
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite build config
│   ├── tailwind.config.js   # Tailwind CSS config
│   ├── postcss.config.js    # PostCSS config
│   │
│   └── src/
│       ├── main.jsx         # React entry point
│       ├── App.jsx          # Root component with auth gating
│       ├── index.css        # Global styles + CSS variables
│       │
│       ├── pages/
│       │   ├── Landing.jsx  # Public landing page
│       │   ├── Auth.jsx     # Login/signup page with OAuth
│       │   └── Dashboard.jsx # Main app: summarizer + matcher
│       │
│       ├── components/
│       │   ├── LiquidGlassCard.jsx    # Reusable glass card
│       │   ├── InternshipCard.jsx     # Internship display
│       │   └── ResumeUpload.jsx       # Resume dropzone
│       │
│       └── lib/
│           ├── auth.jsx    # API calls: CSRF-aware apiFetch helper
│           └── utils.js    # Utility functions
│
└── .github/
    ├── workflows/
    │   └── deploy.yml      # GitHub Actions: build & deploy
    │
    └── skills/
        ├── security-audit/
        │   └── SKILL.md    # Security audit methodology
        └── zero-cost-stack/
            └── SKILL.md    # Free-tier infrastructure guide
```

### Key Files

| File                               | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `app.py`                           | Core Flask app, 1400+ lines, all endpoints & auth logic       |
| `job_scraper.py`                   | Web scraping + LLM extraction + SSRF safeguards               |
| `resume_parser.py`                 | PDF parsing, skill/education/experience extraction            |
| `models.py`                        | 6 SQLAlchemy models (User, Internship, SavedInternship, etc.) |
| `frontend/src/App.jsx`             | Auth gating, route orchestration, session restoration         |
| `frontend/src/pages/Dashboard.jsx` | Main UI: tabs for summarizer and matcher                      |
| `frontend/src/lib/auth.jsx`        | CSRF-aware API layer with token caching                       |

### Adding Features

1. **New backend endpoint**: Add route in `app.py`, decorate with `@app.route`, apply `@limiter` if needed
2. **New frontend page**: Create `.jsx` in `frontend/src/pages/`, add hash route in `App.jsx`
3. **New API integration**: Create utility file in `frontend/src/lib/`, use `apiFetch` helper
4. **Database model**: Add class to `models.py`, run migration (auto on Vercel)

### Performance Optimization

- **Caching**: 24-hour URL summarization cache (avoids re-LLM calls)
- **Rate Limiting**: Per-endpoint limits prevent abuse, configurable via `@limiter.limit()`
- **Lazy Loading**: Frontend lazy-loads components, dashboard has lazy scroll
- **Token Estimation**: Backend estimates tokens to track costs
- **Chunk Splitting**: Vite splits JS into chunks automatically

---

## 🚦 Roadmap

### Upcoming Features

- [ ] Bulk upload multiple internships
- [ ] Team collaboration (share saved collections)
- [ ] Application tracking system (status, notes, follow-ups)
- [ ] Browser extension for one-click saving
- [ ] Email digest of trending internships
- [ ] Custom job alerts based on skills
- [ ] Resume version history
- [ ] Interview prep resources
- [ ] Mobile app (React Native)

### Improvements

- [ ] Full-text search with Elasticsearch/Meilisearch
- [ ] Microservices architecture (scraper/LLM as separate services)
- [ ] GraphQL API
- [ ] Real-time notifications (WebSockets)
- [ ] Analytics dashboard (for Internship Cell)
- [ ] Automated testing suite (pytest, Vitest)
- [ ] Docker containerization
- [ ] Helm charts for K8s deployment

---

## 🤝 Contributing

### Guidelines

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- **Backend**: PEP 8, type hints where possible
- **Frontend**: ESLint + Prettier (run before PR)
- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Tests**: Write tests for new endpoints

### Development Checklist

```bash
# Before pushing
python -m py_compile app.py job_scraper.py models.py resume_parser.py deadline_utils.py
cd frontend && npm run lint && npm run build
git diff --check  # No trailing whitespace
```

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙋 Support

**Issues**: [GitHub Issues](https://github.com/aswin-m-kumar/InternBuddy_CET/issues)

**Contact**: Built for Internship Cell CET by Aswin M Kumar

**Acknowledgments**

- NVIDIA NIM for AI inference
- Neon for PostgreSQL hosting
- Vercel for serverless backend
- GitHub Pages for frontend hosting
- Tailwind CSS and Shadcn UI communities

---

**Last Updated**: April 2026  
**Status**: Production (v1.0)  
**Python**: 3.10+  
**Node**: 20+
