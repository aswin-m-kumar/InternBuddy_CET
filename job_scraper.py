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


def extract_job_details_from_text(text, api_key):
    """Use AI to extract structured job details from raw text."""
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

    prompt = f"""
    Extract internship/job details from this text. Return ONLY valid JSON:
    {{
        "title": "job title",
        "company": "company name",
        "description": "brief description (2-3 sentences)",
        "eligibility": "eligibility criteria summary",
        "required_skills": ["skill1", "skill2"],
        "location": "location or Remote",
        "duration": "duration if mentioned",
        "stipend": "stipend info or null"
    }}

    Text to analyze:
    {text[:6000]}
    """

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[
                {"role": "system", "content": "Extract job data as JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.2
        )

        content = response.choices[0].message.content.strip()
        if content.startswith('```'):
            content = re.sub(r'^```(?:json)?\n?', '', content)
            content = re.sub(r'\n?```$', '', content)

        import json
        return json.loads(content)

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
