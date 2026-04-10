import os
import re
import logging
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


def _clean_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _tokenize(value):
    return re.findall(r"[a-z0-9\+#\.]{2,}", _clean_text(value).lower())


def _token_present(token, source_tokens):
    if token in source_tokens:
        return True

    if len(token) < 5:
        return False

    token_stem = token[:5]
    for source_token in source_tokens:
        if len(source_token) < 5:
            continue
        source_stem = source_token[:5]
        if token_stem == source_stem:
            return True

    return False


def _is_grounded_phrase(phrase, source_text):
    phrase_clean = _clean_text(phrase)
    if not phrase_clean:
        return False

    source_clean = _clean_text(source_text)
    if not source_clean:
        return False

    phrase_lower = phrase_clean.lower()
    source_lower = source_clean.lower()

    if phrase_lower in source_lower:
        return True

    phrase_tokens = _tokenize(phrase_lower)
    if not phrase_tokens:
        return False

    source_tokens = set(_tokenize(source_lower))
    matched = sum(1 for token in phrase_tokens if _token_present(token, source_tokens))
    return matched / len(phrase_tokens) >= 0.75


def _grounded_description(source_text, max_chars=320):
    clean_source = _clean_text(source_text)
    if not clean_source:
        return None

    sentences = re.split(r"(?<=[.!?])\s+", clean_source)
    selected = []
    length = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 25:
            continue

        projected = length + len(sentence) + (1 if selected else 0)
        if projected > max_chars:
            break

        selected.append(sentence)
        length = projected

        if len(selected) >= 2:
            break

    if selected:
        return " ".join(selected)

    return clean_source[:max_chars]


def sanitize_extracted_job_details(raw_details, source_text):
    """Keep only fields grounded in source text to reduce hallucinated values."""
    if not isinstance(raw_details, dict):
        return None

    warnings = []

    def normalize_string_field(field_name):
        raw_value = raw_details.get(field_name)
        if raw_value is None:
            return None

        cleaned = _clean_text(raw_value)
        if not cleaned:
            return None

        if not _is_grounded_phrase(cleaned, source_text):
            warnings.append(f"{field_name} was dropped because it was not clearly present in source text")
            return None

        return cleaned

    sanitized = {
        "title": normalize_string_field("title"),
        "company": normalize_string_field("company"),
        "eligibility": normalize_string_field("eligibility"),
        "location": normalize_string_field("location"),
        "duration": normalize_string_field("duration"),
        "stipend": normalize_string_field("stipend"),
    }

    raw_description = _clean_text(raw_details.get("description"))
    if raw_description and _is_grounded_phrase(raw_description, source_text):
        sanitized["description"] = raw_description
    else:
        if raw_description:
            warnings.append("description was replaced with a direct source excerpt")
        sanitized["description"] = _grounded_description(source_text)

    raw_skills = raw_details.get("required_skills")
    if isinstance(raw_skills, str):
        candidate_skills = [item.strip() for item in raw_skills.split(",") if item.strip()]
    elif isinstance(raw_skills, list):
        candidate_skills = [str(item).strip() for item in raw_skills if str(item).strip()]
    else:
        candidate_skills = []

    deduped_skills = []
    seen = set()
    for skill in candidate_skills:
        key = skill.lower()
        if key in seen:
            continue
        seen.add(key)

        if _is_grounded_phrase(skill, source_text):
            deduped_skills.append(skill)

    if candidate_skills and not deduped_skills:
        warnings.append("required_skills were dropped because they were not clearly present in source text")

    sanitized["required_skills"] = deduped_skills

    if warnings:
        sanitized["grounding_warnings"] = warnings

    return sanitized


def extract_job_details_from_text(text, api_key):
    """Use AI to extract structured job details from raw text."""
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

    prompt = f"""
    Extract internship/job details from this text.

    CRITICAL RULES:
    - Use ONLY details that are explicitly present in the text.
    - Never infer, guess, or fill missing values.
    - If a field is not clearly mentioned, return null for that field.
    - required_skills must include only skills that are directly mentioned.
    - Return ONLY valid JSON with this exact schema:
    {{
        "title": "string or null",
        "company": "string or null",
        "description": "grounded 1-2 sentence summary or null",
        "eligibility": "string or null",
        "required_skills": ["skill1", "skill2"],
        "location": "string or null",
        "duration": "string or null",
        "stipend": "string or null"
    }}

    Text to analyze:
    {text[:6000]}
    """

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[
                {"role": "system", "content": "You are a strict extractor. Return only grounded JSON. Never guess."},
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
        return sanitize_extracted_job_details(parsed, text)

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
