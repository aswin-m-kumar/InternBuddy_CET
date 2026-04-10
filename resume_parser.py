import os
import re
import logging
import pdfplumber
from openai import OpenAI
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

UPLOAD_FOLDER = 'uploads/resumes'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(pdf_path):
    """Extract raw text from PDF using pdfplumber."""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return None


def parse_with_ai(text, api_key):
    """Use AI to extract structured data from resume text."""
    if not text or len(text.strip()) < 50:
        return None

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

    prompt = f"""
    Extract structured information from this resume text. Return ONLY valid JSON with this exact structure:
    {{
        "education": {{
            "degree": "string",
            "branch": "string",
            "year": "string (e.g., '2025' or '2025-2029')",
            "cgpa": "string or null"
        }},
        "skills": ["list of technical skills"],
        "experience": "brief summary of work experience or null",
        "projects": ["list of notable projects"]
    }}

    If any field cannot be determined, use null for that field.
    Do not include any text outside the JSON object.

    Resume text:
    {text[:8000]}
    """

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[
                {"role": "system", "content": "Extract resume data as JSON only. No explanations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.1
        )

        content = response.choices[0].message.content.strip()

        # Clean up markdown code blocks if present
        if content.startswith('```'):
            content = re.sub(r'^```(?:json)?\n?', '', content)
            content = re.sub(r'\n?```$', '', content)

        import json
        parsed = json.loads(content)
        return parsed

    except Exception as e:
        logger.error(f"AI parsing error: {e}")
        return None


def parse_resume(pdf_path, api_key):
    """Main function to parse a resume PDF and return structured data."""
    # Extract text
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return {'error': 'Could not extract text from PDF'}

    # Parse with AI
    parsed_data = parse_with_ai(text, api_key)
    if not parsed_data:
        return {'error': 'Failed to parse resume data'}

    return parsed_data


def save_resume(file, user_id):
    """Save uploaded resume file and return the path."""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    original_name = secure_filename(file.filename) or "resume.pdf"
    filename = f"resume_{user_id}_{original_name}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    file.save(file_path)
    return file_path
