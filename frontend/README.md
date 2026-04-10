# Frontend

This is the Vite + React frontend for **InternBuddy CET**. It handles the student-facing experience: resume upload, personalized internship browsing, and saved internships.

## Scripts

```bash
npm install
npm run dev
npm run build
```

Development runs on `http://localhost:5173` by default.

## Environment

The frontend uses `VITE_API_URL` when provided. If it is not set, it auto-detects:

- `http://127.0.0.1:5000` for local development
- `https://internbuddy-cet.onrender.com` as the production fallback

## Structure

```text
src/
├── App.jsx
├── components/
│   ├── InternshipCard.jsx
│   ├── LiquidGlassCard.jsx
│   └── ResumeUpload.jsx
├── lib/
│   └── auth.jsx
└── pages/
    └── Dashboard.jsx
```

## Notes

- The app is built with Vite and React 19.
- The production build is configured for GitHub Pages via `vite.config.js`.
- This small-scale version loads straight into the dashboard without a login step.
