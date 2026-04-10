import os
import re
import hashlib
import logging
from io import BytesIO
from datetime import datetime, timedelta
from urllib.parse import urlparse, urljoin
import requests
import cloudscraper
from bs4 import BeautifulSoup
from openai import OpenAI
from models import Internship, db

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 15
MAX_REDIRECTS = 5
ALLOWED_SCHEMES = ("http", "https")
UPLOAD_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
UPLOAD_PDF_EXTENSIONS = {"pdf"}
OCR_API_URL = "https://api.ocr.space/parse/image"
PLACEHOLDER_VALUES = {"unknown", "unknown position", "unknown company", "n/a", "na", "none", "null", "not specified"}
STOPWORDS = {
    "the", "and", "for", "with", "this", "that", "from", "into", "will", "are", "you",
    "your", "our", "their", "have", "has", "was", "were", "been", "can", "all", "any",
    "job", "role", "internship", "intern", "candidate", "candidates"
}


def normalize_text(value):
    cleaned = re.sub(r"[^a-z0-9+./# ]+", " ", (value or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def tokenize(value):
    tokens = re.findall(r"[a-z0-9+#./]{3,}", normalize_text(value))
    return {token for token in tokens if token not in STOPWORDS}


def phrase_in_source(phrase, normalized_source):
    normalized_phrase = normalize_text(phrase)
    if not normalized_phrase:
        return False
    return normalized_phrase in normalized_source


def overlap_ratio(value, source_tokens):
    value_tokens = tokenize(value)
    if not value_tokens:
        return 0.0
    overlap_count = sum(1 for token in value_tokens if token in source_tokens)
    return overlap_count / len(value_tokens)


def normalize_skill_list(skills):
    if isinstance(skills, list):
        normalized = [str(skill).strip() for skill in skills if str(skill).strip()]
        return normalized
    if isinstance(skills, str):
        return [item.strip() for item in skills.split(",") if item.strip()]
    return []


def is_placeholder(value):
    if value is None:
        return True
    return normalize_text(str(value)) in PLACEHOLDER_VALUES


def best_effort_excerpt(source_text, max_chars=320):
    if not source_text:
        return None

    parts = re.split(r"(?<=[.!?])\s+", source_text.strip())
    excerpt = ""
    for part in parts:
        sentence = part.strip()
        if len(sentence) < 20:
            continue
        candidate = f"{excerpt} {sentence}".strip()
        if len(candidate) > max_chars:
            break
        excerpt = candidate
        if len(excerpt) >= 200:
            break

    excerpt = excerpt or source_text.strip()[:max_chars]
    return excerpt[:max_chars]


def ground_extracted_details(details, source_text):
    """Drop low-evidence fields so unsupported claims are not returned."""
    if not isinstance(details, dict):
        return None

    grounded = dict(details)
    warnings = []
    checks_total = 0
    checks_passed = 0

    normalized_source = normalize_text(source_text)
    source_tokens = tokenize(source_text)

    scalar_fields = ["title", "company", "location", "duration", "stipend"]
    for field_name in scalar_fields:
        value = grounded.get(field_name)
        if is_placeholder(value):
            grounded[field_name] = None
            continue

        checks_total += 1
        if phrase_in_source(str(value), normalized_source):
            checks_passed += 1
        else:
            grounded[field_name] = None
            warnings.append(f"Dropped {field_name}: not found in source text")

    eligibility_value = grounded.get("eligibility")
    if not is_placeholder(eligibility_value):
        checks_total += 1
        if overlap_ratio(str(eligibility_value), source_tokens) >= 0.5:
            checks_passed += 1
        else:
            grounded["eligibility"] = None
            warnings.append("Dropped eligibility: low evidence in source text")
    else:
        grounded["eligibility"] = None

    description_value = grounded.get("description")
    if not is_placeholder(description_value):
        checks_total += 1
        if overlap_ratio(str(description_value), source_tokens) >= 0.45:
            checks_passed += 1
        else:
            grounded["description"] = best_effort_excerpt(source_text)
            warnings.append("Replaced description with source excerpt to avoid unsupported summary")
    else:
        grounded["description"] = best_effort_excerpt(source_text)

    requested_skills = normalize_skill_list(grounded.get("required_skills"))
    grounded_skills = []
    dropped_skills = []
    for skill in requested_skills:
        checks_total += 1
        if phrase_in_source(skill, normalized_source):
            checks_passed += 1
            grounded_skills.append(skill)
        else:
            dropped_skills.append(skill)

    grounded["required_skills"] = grounded_skills
    if dropped_skills:
        warnings.append("Dropped skills not found in source: " + ", ".join(dropped_skills[:8]))

    confidence_score = int((checks_passed / checks_total) * 100) if checks_total else 0
    grounded["grounding_score"] = confidence_score
    grounded["grounding_warnings"] = warnings

    return grounded


def extract_job_details_from_text(text, api_key):
    """Use AI to extract structured job details from raw text."""
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

    prompt = f"""
    Extract internship/job details ONLY from the given text.
    Rules:
    - Do not guess or infer missing facts.
    - If a field is not explicitly present, return null.
    - required_skills must contain only skills explicitly present in the text.
    - Return ONLY valid JSON with this exact shape:
    {{
        "title": "job title or null",
        "company": "company name or null",
        "description": "concise summary copied/paraphrased from source only or null",
        "eligibility": "eligibility criteria from source or null",
        "required_skills": ["skill1", "skill2"],
        "location": "location or null",
        "duration": "duration or null",
        "stipend": "stipend or null"
    }}

    Text to analyze:
    {text[:6000]}
    """

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are an information extraction engine. Output strict JSON only. Never invent missing values."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.0
        )

        content = response.choices[0].message.content.strip()
        if content.startswith('```'):
            content = re.sub(r'^```(?:json)?\n?', '', content)
            content = re.sub(r'\n?```$', '', content)

        import json
        parsed = json.loads(content)
        return ground_extracted_details(parsed, text)

    except Exception as e:
        logger.error(f"Job details extraction error: {e}")
        return None


def scrape_linkedin_job(url, api_key):
    """Scrape a LinkedIn job posting (with anti-bot handling)."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
    }

    try:
        scraper = cloudscraper.create_scraper()
        response = scraper.get(url, headers=headers, timeout=REQUEST_TIMEOUT)

        if response.status_code == 403:
            return {'error': 'LinkedIn blocked the request (anti-bot protection)'}

        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove scripts and styles
        for elem in soup(["script", "style", "noscript"]):
            elem.extract()

        text = soup.get_text(separator=' ', strip=True)[:10000]

        if len(text) < 100:
            return {'error': 'Could not extract meaningful content from LinkedIn page'}

        details = extract_job_details_from_text(text, api_key)
        if details:
            details['source_url'] = url
            details['raw_data'] = text
            return details

        return {'error': 'Failed to extract job details'}

    except Exception as e:
        logger.error(f"LinkedIn scraping error: {e}")
        return {'error': str(e)}


def scrape_internship_cell_poster(text_content, source_url, api_key):
    """Process Internship Cell poster content."""
    details = extract_job_details_from_text(text_content, api_key)
    if details:
        details['source_url'] = source_url
        details['raw_data'] = text_content
        details['source'] = 'internship_cell'
    return details


def build_file_source_url(file_bytes, filename):
    digest = hashlib.sha256(file_bytes).hexdigest()[:24]
    safe_name = re.sub(r"[^a-zA-Z0-9._-]+", "-", (filename or "upload")).strip("-") or "upload"
    return f"file://{digest}/{safe_name}"


def extract_text_from_pdf_bytes(file_bytes):
    try:
        import pdfplumber

        text_parts = []
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(page_text.strip())

        text = "\n".join(text_parts).strip()
        return text or None
    except Exception as exc:
        logger.error("PDF extraction error: %s", exc)
        return None


def extract_text_from_image_bytes(file_bytes, filename, ocr_api_key=None):
    api_key = ocr_api_key or os.getenv("OCR_SPACE_API_KEY") or "helloworld"
    warnings = []
    if api_key == "helloworld":
        warnings.append("Using OCR demo key; accuracy and rate limits may be restricted")

    payload = {
        "apikey": api_key,
        "language": "eng",
        "OCREngine": "2",
        "isOverlayRequired": "false",
        "detectOrientation": "true",
        "scale": "true",
    }

    files = {
        "filename": (filename or "poster.png", file_bytes)
    }

    try:
        response = requests.post(
            OCR_API_URL,
            data=payload,
            files=files,
            timeout=REQUEST_TIMEOUT + 20,
        )
    except Exception as exc:
        logger.error("OCR request failed: %s", exc)
        return {"error": "OCR request failed", "warnings": warnings}

    if response.status_code != 200:
        logger.error("OCR API returned status %s", response.status_code)
        return {"error": "OCR service unavailable", "warnings": warnings}

    try:
        result = response.json()
    except Exception:
        return {"error": "OCR response parsing failed", "warnings": warnings}

    if result.get("IsErroredOnProcessing"):
        errors = result.get("ErrorMessage") or ["OCR processing failed"]
        return {"error": str(errors[0]), "warnings": warnings}

    parsed_results = result.get("ParsedResults") or []
    extracted = "\n".join(
        (item.get("ParsedText") or "").strip()
        for item in parsed_results
        if (item.get("ParsedText") or "").strip()
    ).strip()

    if not extracted:
        return {"error": "No readable text found in uploaded image", "warnings": warnings}

    return {"text": extracted, "warnings": warnings}


def extract_text_from_uploaded_file(file_bytes, filename, content_type=None, ocr_api_key=None):
    extension = (filename or "").lower().rsplit(".", 1)[-1] if "." in (filename or "") else ""

    if extension in UPLOAD_PDF_EXTENSIONS or content_type == "application/pdf":
        text = extract_text_from_pdf_bytes(file_bytes)
        if not text:
            return {"error": "Could not extract text from PDF", "warnings": []}
        return {"text": text, "warnings": []}

    if extension in UPLOAD_IMAGE_EXTENSIONS or (content_type or "").startswith("image/"):
        return extract_text_from_image_bytes(file_bytes, filename, ocr_api_key)

    supported = ", ".join(sorted(UPLOAD_IMAGE_EXTENSIONS | UPLOAD_PDF_EXTENSIONS))
    return {"error": f"Unsupported file type. Supported formats: {supported}", "warnings": []}


def save_internship(details, source='linkedin'):
    """Save or update internship in database."""
    existing = Internship.query.filter_by(source_url=details.get('source_url')).first()

    if existing:
        # Update existing
        existing.title = details.get('title', existing.title)
        existing.company = details.get('company', existing.company)
        existing.description = details.get('description', existing.description)
        existing.eligibility = details.get('eligibility', existing.eligibility)
        existing.required_skills = details.get('required_skills', existing.required_skills)
        existing.location = details.get('location', existing.location)
        existing.duration = details.get('duration', existing.duration)
        existing.stipend = details.get('stipend', existing.stipend)
        existing.is_active = True
        db.session.commit()
        return existing
    else:
        # Create new
        internship = Internship(
            title=details.get('title', 'Unknown Position'),
            company=details.get('company', 'Unknown Company'),
            source=source,
            source_url=details.get('source_url'),
            description=details.get('description'),
            eligibility=details.get('eligibility'),
            required_skills=details.get('required_skills', []),
            location=details.get('location'),
            duration=details.get('duration'),
            stipend=details.get('stipend'),
            raw_data=details.get('raw_data')
        )
        db.session.add(internship)
        db.session.commit()
        return internship


def parse_deadline_from_text(text):
    """Try to extract deadline from text."""
    # Simple patterns for common deadline formats
    patterns = [
        r'(\d{1,2}\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*\d{4})',
        r'(\d{1,2}/\d{1,2}/\d{4})',
        r'(\d{4}-\d{2}-\d{2})'
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Could be enhanced with dateutil parser
            return datetime.now() + timedelta(days=30)  # Default fallback

    return None
