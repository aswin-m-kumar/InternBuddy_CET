# InternBuddy CET

InternBuddy CET is an AI-powered internship assistant for students. It supports:

- Internship summarization from URL, pasted text, or poster/PDF upload
- Resume-to-internship compatibility analysis with skill gap insights
- Deadline checks (expired, expiring soon, rolling/no-deadline hints)
- Cost-conscious operation with caching, request limits, and usage logging

The deployment architecture is split:

- Frontend: GitHub Pages (React + Vite)
- Backend: Vercel (Flask API)

## Tech Stack

- Frontend: React 19, Vite 8, Tailwind CSS
- Backend: Flask, Flask-SQLAlchemy, Flask-Limiter
- AI: NVIDIA NIM via OpenAI-compatible API
- File extraction: pdfplumber, PyPDF2, OCR.Space, Pillow
- Database: SQLite (local), PostgreSQL/Neon (production)

## Step-by-Step Local Setup

Prerequisites:

- Python 3.10+
- Node.js 20+
- npm 10+

1. Clone and enter the project

```bash
git clone https://github.com/aswin-m-kumar/InternBuddy_CET.git
cd InternBuddy_CET
```

2. Create and activate Python environment

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
```

3. Install backend dependencies

```bash
pip install -r requirements.txt
```

4. Create root `.env` from `.env.example`

```env
SECRET_KEY=dev-secret-key
DATABASE_URL=sqlite:///internbuddy.db
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
RATELIMIT_STORAGE_URI=memory://
NVIDIA_API_KEY=your-nvidia-api-key
OCR_SPACE_API_KEY=your-ocr-space-api-key
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
SUMMARIZATION_MODEL=meta/llama-3.1-8b-instruct
ANALYSIS_MODEL=meta/llama-3.1-70b-instruct
ADMIN_KEY=replace-with-a-strong-random-key
```

5. Start backend

```bash
python app.py
```

Backend runs at `http://127.0.0.1:5000`.

6. Install and run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and calls local backend automatically.

## Step-by-Step Production Deployment

### A) Backend on Vercel

1. Import repository into Vercel
2. Keep root directory as `.`
3. Ensure `vercel.json` and `api/index.py` are present (already in repo)
4. Add environment variables in Vercel Project Settings
5. Set `DATABASE_URL` to a PostgreSQL instance (Neon recommended)
6. Deploy and copy backend URL, for example:
   `https://intern-buddy-cet.vercel.app`

Recommended backend environment variables:

- `SECRET_KEY`
- `DATABASE_URL`
- `RATELIMIT_STORAGE_URI` (use Redis/Valkey in production, avoid `memory://`)
- `NVIDIA_API_KEY`
- `OCR_SPACE_API_KEY`
- `ALLOWED_ORIGINS=https://aswin-m-kumar.github.io`
- `SUMMARIZATION_MODEL`
- `ANALYSIS_MODEL`
- `ADMIN_KEY`

### B) Frontend on GitHub Pages

1. In GitHub repo, add secret `VITE_API_URL` with your Vercel backend URL
2. Ensure Pages is enabled for GitHub Actions
3. Push to the deployment branch used by `.github/workflows/deploy.yml`
4. Wait for workflow completion and open the Pages URL

Important:

- `frontend/vite.config.js` base path must match repository name (`/InternBuddy_CET/`)
- `ALLOWED_ORIGINS` on backend must include your GitHub Pages origin

## Environment Variables Reference

Root backend variables (`.env`):

- `SECRET_KEY`: Flask secret key
- `DATABASE_URL`: SQLite local or PostgreSQL production URL
- `PORT`: backend port (local)
- `ALLOWED_ORIGINS`: comma-separated CORS origins
- `RATELIMIT_STORAGE_URI`: Flask-Limiter store (`memory://` local, Redis/Valkey in production)
- `NVIDIA_API_KEY`: AI API key
- `OCR_SPACE_API_KEY`: OCR API key
- `LLM_BASE_URL`: AI base URL
- `SUMMARIZATION_MODEL`: model for internship extraction/summarization
- `ANALYSIS_MODEL`: model for resume compatibility analysis
- `ADMIN_KEY`: protects usage stats endpoint

Frontend build variable:

- `VITE_API_URL`: production backend URL for GitHub Pages build

## OAuth & CSRF Flow (For Developers)

### Session & Token Lifecycle

1. User visits app → `App.jsx` calls `getAuthSession()` → includes CSRF token in response
2. All subsequent mutating requests use `apiFetch()` helper which:
   - Caches CSRF token from auth response
   - Injects `X-CSRF-Token` header for POST/PUT/DELETE
   - Includes `credentials: include` for session cookie
3. On logout → `clearAuthCaches()` removes cached token → user redirected to `/api/auth/signin`
4. On sign-in/signup success → new CSRF token generated server-side and returned

### Google OAuth

- User clicks "Sign in with Google" → redirects to `/api/auth/google/start`
- Backend validates Google `id_token` and creates/updates user
- Session established server-side with CSRF token
- User redirected to `/#dashboard` on success or `/#auth?oauth_error=...` on failure

## API Overview

### Public Endpoints

- `GET /api/auth/csrf` — Fetch CSRF token for authenticated sessions
- `POST /api/auth/signup` — Create new local account
- `POST /api/auth/signin` — Sign in with email and password
- `POST /api/auth/signout` — Clear session and sign out
- `GET /api/auth/me` — Check authentication status and get CSRF token
- `GET /api/auth/google/start` — Initiate Google OAuth flow
- `GET /api/auth/google/callback` — Google OAuth callback handler

### Protected Endpoints (require authentication)

- `POST /api/internships/summarize` (URL/Text summarization)
- `POST /api/internships/summarize-file` (Poster/PDF upload and summarization)
- `POST /api/resume/analyze` (Resume-to-internship match analysis)
- `GET /api/internships` (list internships with eligibility scoring)
- `GET /api/internships/<id>` (get single internship details)
- `POST /api/internships/<id>/save` (save internship to collection)
- `DELETE /api/internships/<id>/save` (unsave internship)
- `GET /api/saved` (list saved internships)
- `POST /api/resume/upload` (upload and parse resume PDF)
- `GET /api/resume` (get parsed resume data)
- `GET /api/admin/usage` (admin usage metrics, requires `X-Admin-Key` header)

## Security & Session Management

### Authentication

- Local email/password signup and signin
- Google OAuth 2.0 integration with granular error handling
- Server-side session cookies with `httpOnly`, `Secure`, and `SameSite` attributes
- 30-day persistent session lifetime
- Automatic session restoration on app load (transparent to user)
- Protected API endpoints enforce signed-in user verification

### CSRF Protection

- CSRF tokens issued on `/api/auth/csrf` and included in auth responses
- All API mutations (POST, PUT, DELETE) require `X-CSRF-Token` header
- Tokens refreshed on every authentication action
- Frontend automatically includes token in mutating requests via `apiFetch` helper

### Operational Hardening

- Production `SECRET_KEY` must be explicitly set (fails at startup if not on Vercel)
- Production `RATELIMIT_STORAGE_URI` must be explicitly set (Redis/Valkey, not in-memory)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (on HTTPS)
- All API responses include `Cache-Control: no-store` to prevent client caching of sensitive data

## Cost and Reliability Controls

- URL summarization caching to avoid repeated model calls
- Endpoint rate limiting with Flask-Limiter (distributed storage recommended for production)
- Separate models for summarization vs deep analysis
- Token-conscious prompts and normalized outputs
- Usage logs persisted in database for monitoring

## Troubleshooting

- **401 from protected endpoints:**
  User must be signed in. Check that `/api/auth/me` returns `authenticated: true`.
- **403 CSRF_TOKEN_MISSING or CSRF_TOKEN_INVALID:**
  Frontend must call `/api/auth/csrf` before mutating requests; session may have expired. Refresh page to re-establish session.
- **401 from admin usage endpoint:**
  Check `X-Admin-Key` header matches `ADMIN_KEY` environment variable.
- **CORS errors on production:**
  Ensure `ALLOWED_ORIGINS` includes exact Pages origin (e.g., `https://aswin-m-kumar.github.io`).
- **OCR extraction weak or failing:**
  Set your own `OCR_SPACE_API_KEY`; demo key has strict limits.
- **LinkedIn URL not parsed:**
  Anti-bot pages can block scraping. Use pasted details or upload mode instead.
- **Resume analyze disabled in UI:**
  Confirm PDF uploaded and valid internship input selected, and user is signed in.
- **Session lost after page refresh:**
  Browser cookie settings may block third-party cookies. Check CORS `allow_headers` includes `Set-Cookie`; ensure frontend origin is trusted.

## Development Validation Checklist

Run before pushing:

```bash
# backend
python -m py_compile app.py job_scraper.py models.py resume_parser.py deadline_utils.py

# frontend
cd frontend
npm run lint
npm run build
```

## License

MIT
