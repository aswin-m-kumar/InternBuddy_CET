import os
import hashlib
import logging
from urllib.parse import urlparse

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

from models import db, init_db, User, Internship, SavedInternship, Application
from resume_parser import allowed_file, save_resume, parse_resume, MAX_FILE_SIZE
from job_scraper import scrape_linkedin_job, save_internship, extract_job_details_from_text
from matcher import calculate_eligibility_score, search_internships

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

running_on_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
app = Flask(__name__, instance_path="/tmp") if running_on_vercel else Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")

database_url = os.getenv("DATABASE_URL", "sqlite:///internbuddy.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE

allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://aswin-m-kumar.github.io",
    ]

CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=True
)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["20 per hour"],
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://")
)

init_db(app)


def get_default_user():
    """Return a single local profile used by the small-scale deployment."""
    user = User.query.filter_by(email="local@internbuddy.app").first()
    if not user:
        user = User(
            email="local@internbuddy.app",
            name="Local Student",
            provider="local"
        )
        db.session.add(user)
        db.session.commit()
    return user


def is_valid_http_url(value):
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def build_text_submission_source(text):
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:24]
    return f"text://{digest}"


def normalize_skills(skills):
    if isinstance(skills, list):
        return [str(skill).strip() for skill in skills if str(skill).strip()]

    if isinstance(skills, str):
        return [item.strip() for item in skills.split(",") if item.strip()]

    return []


def build_summary_response(details, internship, input_type):
    source_url = details.get("source_url") or internship.source_url
    if input_type == "text" and isinstance(source_url, str) and source_url.startswith("text://"):
        source_url = None

    role_summary = internship.description or details.get("description") or "Summary not available"

    return {
        "title": internship.title,
        "company": internship.company,
        "role_summary": role_summary,
        "skills": normalize_skills(internship.required_skills or details.get("required_skills")),
        "eligibility": internship.eligibility or details.get("eligibility"),
        "stipend": internship.stipend or details.get("stipend"),
        "location": internship.location or details.get("location"),
        "duration": internship.duration or details.get("duration"),
        "source_url": source_url,
        "grounding_warnings": details.get("grounding_warnings", []),
    }


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.route("/")
def index():
    return jsonify({
        "service": "InternBuddy API",
        "owner": "Aswin M Kumar",
        "status": "ok",
        "message": "Frontend is hosted on GitHub Pages. Use /api/internships/summarize for internship summaries."
    })


@app.route("/dashboard")
def serve_spa(path=None):
    return jsonify({
        "error": "Dashboard UI is served from GitHub Pages in this deployment."
    }), 404


@app.errorhandler(413)
def payload_too_large(_):
    return jsonify({"error": "Payload too large"}), 413


# ============== Resume Endpoints ==============

@app.route("/api/resume/upload", methods=["POST"])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    user = get_default_user()
    filename = save_resume(file, user.id)

    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        return jsonify({'error': 'Backend configuration error'}), 500

    parsed_data = parse_resume(filename, api_key)

    if 'error' in parsed_data:
        return jsonify({'error': parsed_data['error']}), 400

    user.education = parsed_data.get('education')
    user.skills = parsed_data.get('skills', [])
    user.experience = parsed_data.get('experience')
    user.projects = parsed_data.get('projects', [])
    user.resume_path = filename

    db.session.commit()

    return jsonify({
        'success': True,
        'data': parsed_data
    })


@app.route("/api/resume")
def get_resume():
    user = get_default_user()
    return jsonify({
        'education': user.education,
        'skills': user.skills,
        'experience': user.experience,
        'projects': user.projects,
        'has_resume': bool(user.resume_path)
    })


# ============== Internship Endpoints ==============

@app.route("/api/internships", methods=["GET"])
def list_internships():
    query = request.args.get('q', '')
    location = request.args.get('location', '')
    source = request.args.get('source', '')

    filters = {}
    if location:
        filters['location'] = location

    conditions = search_internships(query, filters if filters else None)

    internships_query = Internship.query.filter(conditions)

    if source:
        internships_query = internships_query.filter(Internship.source == source)

    internships = internships_query.order_by(Internship.posted_at.desc()).limit(50).all()

    user = get_default_user()
    api_key = os.getenv("NVIDIA_API_KEY")

    results = []
    for intern in internships:
        eligibility = None
        if user.skills or user.education:
            eligibility = calculate_eligibility_score(
                {
                    'education': user.education,
                    'skills': user.skills,
                    'experience': user.experience,
                    'projects': user.projects
                },
                intern,
                api_key
            )

        saved = SavedInternship.query.filter_by(
            user_id=user.id,
            internship_id=intern.id
        ).first() is not None

        results.append({
            'id': intern.id,
            'title': intern.title,
            'company': intern.company,
            'source': intern.source,
            'source_url': intern.source_url,
            'location': intern.location,
            'duration': intern.duration,
            'stipend': intern.stipend,
            'posted_at': intern.posted_at.isoformat() if intern.posted_at else None,
            'eligibility': eligibility,
            'saved': saved
        })

    return jsonify({'internships': results})


@app.route("/api/internships/<int:internship_id>", methods=["GET"])
def get_internship(internship_id):
    intern = Internship.query.get_or_404(internship_id)
    user = get_default_user()
    api_key = os.getenv("NVIDIA_API_KEY")

    eligibility = None
    if user.skills or user.education:
        eligibility = calculate_eligibility_score(
            {
                'education': user.education,
                'skills': user.skills,
                'experience': user.experience,
                'projects': user.projects
            },
            intern,
            api_key
        )

    saved = SavedInternship.query.filter_by(
        user_id=user.id,
        internship_id=intern.id
    ).first() is not None

    return jsonify({
        'id': intern.id,
        'title': intern.title,
        'company': intern.company,
        'source': intern.source,
        'source_url': intern.source_url,
        'description': intern.description,
        'eligibility_criteria': intern.eligibility,
        'required_skills': intern.required_skills,
        'location': intern.location,
        'duration': intern.duration,
        'stipend': intern.stipend,
        'posted_at': intern.posted_at.isoformat() if intern.posted_at else None,
        'eligibility': eligibility,
        'saved': saved
    })


@app.route("/api/internships/<int:internship_id>/save", methods=["POST"])
def save_internship_endpoint(internship_id):
    user = get_default_user()
    Internship.query.get_or_404(internship_id)

    existing = SavedInternship.query.filter_by(
        user_id=user.id,
        internship_id=internship_id
    ).first()

    if existing:
        return jsonify({'error': 'Already saved'}), 400

    saved = SavedInternship(user_id=user.id, internship_id=internship_id)
    db.session.add(saved)
    db.session.commit()

    return jsonify({'success': True})


@app.route("/api/internships/<int:internship_id>/save", methods=["DELETE"])
def unsave_internship_endpoint(internship_id):
    user = get_default_user()

    saved = SavedInternship.query.filter_by(
        user_id=user.id,
        internship_id=internship_id
    ).first()

    if saved:
        db.session.delete(saved)
        db.session.commit()

    return jsonify({'success': True})


@app.route("/api/saved", methods=["GET"])
def list_saved():
    user = get_default_user()
    saved = SavedInternship.query.filter_by(user_id=user.id).all()

    results = []
    for s in saved:
        intern = s.internship
        results.append({
            'id': intern.id,
            'title': intern.title,
            'company': intern.company,
            'source': intern.source,
            'source_url': intern.source_url,
            'duration': intern.duration,
            'stipend': intern.stipend,
            'location': intern.location,
            'saved': True,
            'saved_at': s.saved_at.isoformat() if s.saved_at else None
        })

    return jsonify({'internships': results})


# ============== Manual Internship Submission ==============

@app.route("/api/internships/summarize", methods=["POST"])
@limiter.limit("10 per minute")
def summarize_internship():
    data = request.get_json(silent=True) or {}
    input_type = (data.get("input_type") or "").strip().lower()
    user_input = (data.get("input") or "").strip()

    if input_type not in {"url", "text"}:
        return jsonify({"error": "input_type must be either 'url' or 'text'"}), 400

    if not user_input:
        return jsonify({"error": "input is required"}), 400

    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        return jsonify({"error": "Backend configuration error"}), 500

    details = None
    source = "manual"

    if input_type == "url":
        if not is_valid_http_url(user_input):
            return jsonify({"error": "Provide a valid URL starting with http:// or https://"}), 400

        details = scrape_linkedin_job(user_input, api_key)
        if not details or "error" in details:
            error_message = details.get("error") if details else "Could not summarize this internship URL"
            lower_error = error_message.lower()

            if "blocked" in lower_error or "anti-bot" in lower_error:
                return jsonify({
                    "error": "LinkedIn blocked automatic scraping. Paste internship details text instead.",
                    "error_code": "LINKEDIN_BLOCKED"
                }), 422

            return jsonify({"error": error_message}), 422
    else:
        details = extract_job_details_from_text(user_input, api_key)
        if not details:
            return jsonify({
                "error": "Could not summarize the internship details. Please provide more specific text."
            }), 422

        details["source_url"] = build_text_submission_source(user_input)
        details["raw_data"] = user_input[:10000]
        source = "manual_text"

    if not details.get("source_url"):
        details["source_url"] = build_text_submission_source(user_input)

    core_signals = [
        details.get("title"),
        details.get("company"),
        details.get("description"),
        details.get("required_skills"),
    ]
    has_core_signal = any(
        signal for signal in core_signals if signal and (not isinstance(signal, list) or len(signal) > 0)
    )
    if not has_core_signal:
        return jsonify({
            "error": "Could not extract reliable details from this source. Paste fuller internship text to reduce AI guessing."
        }), 422

    internship = save_internship(details, source=source)
    summary = build_summary_response(details, internship, input_type)

    return jsonify({
        "success": True,
        "internship_id": internship.id,
        "summary": summary
    })

@app.route("/api/internships/submit", methods=["POST"])
def submit_internship():
    data = request.get_json(silent=True) or {}
    url = (data.get('url') or '').strip()

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    if not is_valid_http_url(url):
        return jsonify({'error': 'Provide a valid URL starting with http:// or https://'}), 400

    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        return jsonify({'error': 'Backend configuration error'}), 500

    details = scrape_linkedin_job(url, api_key)

    if 'error' in details:
        message = details['error']
        if 'blocked' in message.lower() or 'anti-bot' in message.lower():
            return jsonify({
                'error': 'LinkedIn blocked automatic scraping. Paste internship details text instead.',
                'error_code': 'LINKEDIN_BLOCKED'
            }), 422
        return jsonify({'error': message}), 422

    internship = save_internship(details, source='manual')

    return jsonify({
        'success': True,
        'internship_id': internship.id
    })


# ============== Legacy Endpoint (for backward compatibility) ==============

@app.route("/api/generate", methods=["POST"])
@limiter.limit("5 per minute")
def generate_legacy():
    """Legacy endpoint from InternAgent - kept for backward compatibility."""
    return jsonify({
        'error': 'This endpoint is deprecated. Use /api/internships/summarize instead.'
    }), 410


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
