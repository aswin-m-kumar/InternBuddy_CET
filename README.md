# InternBuddy CET

**InternBuddy CET** is an AI-powered internship discovery platform built for students of College of Engineering Trivandrum. It aggregates internships from multiple sources (LinkedIn, Internship Cell posters, and other job boards), parses your resume to understand your skills and eligibility, and provides personalized recommendations with match scores.

Built to solve the student pain point: manually searching multiple platforms, wondering if you're eligible, and missing deadlines.

---

## Features

- **Multi-Source Aggregation** — Internships from LinkedIn, Internship Cell CET, and other job boards in one place
- **Resume Parsing** — Upload your PDF resume; AI extracts education, skills, experience, and projects
- **Eligibility Scoring** — See your match percentage for each internship with breakdown of matching/missing skills
- **Personalized Feed** — Search and filter internships based on your profile and preferences
- **Saved Internships** — Bookmark opportunities to apply later

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 8, Tailwind CSS, Framer Motion, React Router, @shadergradient/react |
| Backend | Python, Flask, Flask-SQLAlchemy |
| AI | NVIDIA NIM — `meta/llama-3.1-70b-instruct` |
| PDF Parsing | pdfplumber, PyPDF2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Deployment | GitHub Pages (frontend) + Render (backend) |

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

> Note: Update `vite.config.js` `base: '/InternBuddy_CET/'` to match your repo name.

### Backend — Render

Deploy as a **Web Service** on [Render](https://render.com):

1. Connect your GitHub repository
2. Root Directory: `.` (root)
3. Start Command: `gunicorn app:app`
4. Set environment variables from `.env.example`
5. Choose Python runtime

Gunicorn is pre-configured via `gunicorn.conf.py` with a **120-second timeout** and **2 workers**.

---

## Project Structure

```
InternBuddy_CET/
├── app.py                     # Flask app, routes, API endpoints
├── models.py                  # SQLAlchemy models (User, Internship, Application)
├── resume_parser.py           # PDF resume parsing with AI extraction
├── job_scraper.py             # Multi-source internship scraping
├── matcher.py                 # Eligibility scoring algorithm
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
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload PDF resume |
| GET | `/api/resume` | Get parsed local profile data |

### Internships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/internships` | List internships (with search/filters) |
| GET | `/api/internships/:id` | Get internship details |
| POST | `/api/internships/:id/save` | Save internship |
| DELETE | `/api/internships/:id/save` | Unsave internship |
| GET | `/api/saved` | List saved internships |
| POST | `/api/internships/submit` | Submit LinkedIn URL for scraping |

---

## How It Works

1. **Upload Resume** — PDF is parsed to extract education, skills, experience
2. **Build Profile** — The parsed resume becomes your local matching profile
3. **Browse Feed** — AI-powered matching shows eligibility scores for each internship
4. **Search & Filter** — Find opportunities by keyword, location, duration
5. **Save & Apply** — Bookmark interesting roles and apply directly via source URL

---

## Development Notes

- **No Login Required:** This small-scale version uses a single local profile instead of student authentication.
- **Database Migrations:** For SQLite, the database auto-creates on first run. For PostgreSQL production, use Alembic for migrations.
- **LinkedIn Scraping:** LinkedIn has strong anti-bot protection. The `job_scraper.py` uses `cloudscraper` as a fallback, but manual submission or API access may be needed for reliable scraping.
- **Rate Limits:** Default is 20 requests/hour per IP. Adjust in `app.py` based on deployment needs.

---

## License

MIT
