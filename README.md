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

## API Overview

- `POST /api/internships/summarize` (URL/Text)
- `POST /api/internships/summarize-file` (Poster/PDF upload)
- `POST /api/resume/analyze` (Resume match analysis)
- `GET /api/admin/usage` (admin usage metrics, requires `x-admin-key`)

## Cost and Reliability Controls

- URL summarization caching to avoid repeated model calls
- Endpoint rate limiting with Flask-Limiter
- Separate models for summarization vs deep analysis
- Token-conscious prompts and normalized outputs
- Usage logs persisted in database for monitoring

## Troubleshooting

- 401 from admin usage endpoint:
  check `x-admin-key` header matches `ADMIN_KEY`.
- CORS errors on production:
  ensure `ALLOWED_ORIGINS` includes exact Pages origin.
- OCR extraction weak or failing:
  set your own `OCR_SPACE_API_KEY`; demo key has strict limits.
- LinkedIn URL not parsed:
  anti-bot pages can block scraping, use pasted details or upload mode.
- Resume analyze disabled in UI:
  confirm PDF uploaded and valid internship input selected.

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
