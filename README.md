# InternBuddy CET

**InternBuddy CET** is an AI-powered internship discovery platform built for students of College of Engineering Trivandrum. It aggregates internships from multiple sources (LinkedIn, Internship Cell posters, and other job boards), parses your resume to understand your skills and eligibility, and provides personalized recommendations with match scores.

Built to solve the student pain point: manually searching multiple platforms, wondering if you're eligible, and missing deadlines.

Phase 2 of this repository is a **summarizer-first experience**: students paste an internship link, raw details, or upload posters/PDFs to receive a structured summary instantly.

---

## Features

- **Internship Summarizer (URL/Text/Upload)** — Paste an internship link, raw details, or upload poster files for structured output
- **Structured Output** — Extracts role summary, skills, eligibility, stipend, location, and duration
- **Poster OCR Pipeline** — Supports PNG/JPG/WEBP/PDF uploads and extracts readable text before summarization
- **Persistent Storage** — Summaries are stored in the backend database for reuse
- **LinkedIn Fallback Guidance** — If anti-bot protection blocks scraping, app prompts users to paste text details
- **Resume + Matching Modules Kept** — Existing profile/matching code remains in repo for later phases

---

## Tech Stack

| Layer       | Stack                                                                              |
| ----------- | ---------------------------------------------------------------------------------- |
| Frontend    | React 19, Vite 8, Tailwind CSS, Framer Motion, React Router, @shadergradient/react |
| Backend     | Python, Flask, Flask-SQLAlchemy                                                    |
| AI          | NVIDIA NIM — `meta/llama-3.1-70b-instruct`                                         |
| PDF Parsing | pdfplumber, PyPDF2                                                                 |
| Database    | SQLite (dev) / PostgreSQL (prod)                                                   |
| Deployment  | GitHub Pages (frontend) + Vercel (backend)                                         |

---

## Local Setup

**Prerequisites:** Python 3.10+, Node.js 20+

### 1. Clone

```bash
git clone https://github.com/aswin-m-kumar/InternBuddy_CET.git
cd InternBuddy_CET
```

### 2. Backend

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file at the project root (see `.env.example`):

```env
SECRET_KEY=dev-secret-key
DATABASE_URL=sqlite:///internbuddy.db
NVIDIA_API_KEY=your-nvidia-api-key
ALLOWED_ORIGINS=http://localhost:5173
```

Run the backend:

```bash
python app.py
```

Backend will be available at `http://127.0.0.1:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend auto-detects localhost and routes API calls to `http://127.0.0.1:5000`.

---

## Deployment

### Frontend — GitHub Pages

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the Vite app and deploys `frontend/dist` to GitHub Pages.

Set this GitHub repository secret for production builds:

- `VITE_API_URL=https://your-vercel-backend.vercel.app`

> Note: Update `vite.config.js` `base: '/InternBuddy_CET/'` to match your repo name.

### Backend — Vercel

Deploy the Flask API to [Vercel](https://vercel.com):

1. Import this repository in Vercel
2. Keep root directory as `.`
3. Vercel uses `vercel.json` and `api/index.py` to route requests into Flask
4. Add environment variables from `.env.example`
5. Set `DATABASE_URL` to PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)

Minimum production variables:

- `SECRET_KEY`
- `DATABASE_URL`
- `NVIDIA_API_KEY`
- `OCR_SPACE_API_KEY` (optional but recommended for higher OCR reliability)
- `ALLOWED_ORIGINS=https://aswin-m-kumar.github.io`

---

## Project Structure

```
InternBuddy_CET/
├── app.py                     # Flask app, routes, API endpoints
├── api/
│   └── index.py               # Vercel Python entrypoint
├── models.py                  # SQLAlchemy models (User, Internship, Application)
├── resume_parser.py           # PDF resume parsing with AI extraction
├── job_scraper.py             # Multi-source internship scraping
├── matcher.py                 # Eligibility scoring algorithm
├── vercel.json                # Vercel routing/runtime config
├── requirements.txt
├── .env                       # (gitignored) Environment variables
└── frontend/
    ├── src/
    │   ├── App.jsx                        # Main layout and dashboard shell
    │   ├── pages/
    │   │   └── Dashboard.jsx              # Main student dashboard
    │   ├── components/
    │   │   ├── InternshipCard.jsx         # Internship listing card
    │   │   ├── ResumeUpload.jsx           # PDF upload + parsing status
    │   │   └── LiquidGlassCard.jsx        # Glassmorphism card component
    │   ├── lib/
    │   │   └── auth.jsx                   # API base URL helper
    │   └── index.css                      # Tailwind + custom styles
    ├── vite.config.js
    └── tailwind.config.js
```

---

## API Endpoints

### Resume

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/resume/upload` | Upload PDF resume             |
| GET    | `/api/resume`        | Get parsed local profile data |

### Internships

| Method | Endpoint                          | Description                                   |
| ------ | --------------------------------- | --------------------------------------------- |
| POST   | `/api/internships/summarize`      | Summarize internship from URL or text         |
| POST   | `/api/internships/summarize-file` | Summarize internship from uploaded poster/PDF |
| GET    | `/api/internships`                | List internships (with search/filters)        |
| GET    | `/api/internships/:id`            | Get internship details                        |
| POST   | `/api/internships/:id/save`       | Save internship                               |
| DELETE | `/api/internships/:id/save`       | Unsave internship                             |
| GET    | `/api/saved`                      | List saved internships                        |
| POST   | `/api/internships/submit`         | Submit LinkedIn URL for scraping              |

---

## How It Works

1. **Submit internship input** — Students can use URL mode, pasted-details mode, or poster/PDF upload mode
2. **Text extraction and AI parsing** — Uploaded files pass through OCR/PDF extraction, then AI normalizes title, company, summary, skills, and eligibility
3. **View instant summary** — Frontend renders concise cards for quick screening
4. **Persist for reuse** — Parsed records are saved in the internship database
5. **Fallback on blocked scraping** — If LinkedIn blocks, users are guided to paste details manually

---

## Development Notes

- **No Login Required:** This small-scale version uses a single local profile instead of student authentication.
- **Database Migrations:** For SQLite, the database auto-creates on first run. For PostgreSQL production, use Alembic for migrations.
- **LinkedIn Scraping:** LinkedIn has strong anti-bot protection. If blocked, API responds with guidance to paste raw internship details.
- **Poster OCR Key:** Without `OCR_SPACE_API_KEY`, the demo OCR key applies strict limits (including ~1MB image size). Configure your own key for reliable Phase 2 uploads.
- **Rate Limits:** Default is 20 requests/hour per IP globally and 10 requests/minute for both `/api/internships/summarize` and `/api/internships/summarize-file`.
- **Resume & Matching Modules:** Still present in codebase but not the primary summarizer frontend flow.

---

## License

MIT
