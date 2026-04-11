import re
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))

ROLLING_KEYWORDS = {
    "rolling basis",
    "rolling",
    "open until filled",
    "ongoing",
}

MONTH_DAY_FORMATS = [
    "%b %d",
    "%B %d",
    "%d %b",
    "%d %B",
]

FULL_DATE_FORMATS = [
    "%B %d, %Y",
    "%b %d, %Y",
    "%d %B %Y",
    "%d %b %Y",
    "%d/%m/%Y",
    "%Y-%m-%d",
]


def _sanitize_deadline_text(raw_deadline):
    if raw_deadline is None:
        return ""

    text = str(raw_deadline)
    text = text.strip()
    text = re.sub(r"(\d{1,2})(st|nd|rd|th)\b", r"\1", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_deadline_candidate(details, internship_summary=None):
    if isinstance(details, dict):
        for key in ("deadline", "application_deadline", "last_date"):
            value = details.get(key)
            if value:
                return str(value).strip()

        raw_data = details.get("raw_data") or ""
    else:
        raw_data = ""

    if isinstance(internship_summary, dict):
        for key in ("deadline", "application_deadline"):
            value = internship_summary.get(key)
            if value:
                return str(value).strip()

        role_summary = internship_summary.get("role_summary") or ""
    else:
        role_summary = ""

    search_text = "\n".join(part for part in [raw_data, role_summary] if part)
    if not search_text:
        return None

    lowered = search_text.lower()
    for keyword in ROLLING_KEYWORDS:
        if keyword in lowered:
            return keyword

    # Capture common "Deadline: ..." style phrases.
    match = re.search(
        r"(?:deadline|last date|apply by|application deadline)\s*[:\-]?\s*([^\n\r.;]{3,80})",
        search_text,
        flags=re.IGNORECASE,
    )
    if match:
        return match.group(1).strip()

    # Fallback: try to find first date-like token in text.
    fallback_patterns = [
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b\d{1,2}/\d{1,2}/\d{4}\b",
        r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?\b",
        r"\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?\b",
    ]
    for pattern in fallback_patterns:
        fallback_match = re.search(pattern, search_text, flags=re.IGNORECASE)
        if fallback_match:
            return fallback_match.group(0).strip()

    return None


def parse_deadline(raw_deadline, now_ist=None):
    now_ist = now_ist or datetime.now(IST)
    today = now_ist.date()

    result = {
        "raw": raw_deadline,
        "parsed": None,
        "expired": False,
        "expiring_soon": False,
        "days_remaining": None,
        "days_ago": None,
        "deadline_warning": None,
        "deadline_note": None,
        "deadline_assumed_year": False,
    }

    cleaned = _sanitize_deadline_text(raw_deadline)
    if not cleaned:
        result["deadline_warning"] = "none_found"
        result["deadline_note"] = "No deadline detected. Verify manually before applying."
        return result

    lowered = cleaned.lower()
    if lowered in ROLLING_KEYWORDS:
        result["deadline_warning"] = "rolling"
        result["deadline_note"] = "No fixed deadline. Verify before applying."
        return result

    parsed_date = None
    assumed_year = False

    # First pass: formats with explicit year.
    for fmt in FULL_DATE_FORMATS:
        try:
            parsed_date = datetime.strptime(cleaned, fmt).date()
            break
        except ValueError:
            continue

    # Second pass: month/day only, assume year in IST.
    if parsed_date is None:
        for fmt in MONTH_DAY_FORMATS:
            try:
                partial = datetime.strptime(cleaned, fmt)
                assumed_year = True
                candidate = partial.date().replace(year=today.year)
                if candidate < today:
                    candidate = candidate.replace(year=today.year + 1)
                parsed_date = candidate
                break
            except ValueError:
                continue

    if parsed_date is None:
        result["deadline_warning"] = "none_found"
        result["deadline_note"] = "No deadline detected. Verify manually before applying."
        return result

    result["parsed"] = parsed_date.isoformat()

    if assumed_year:
        result["deadline_assumed_year"] = True
        result["deadline_warning"] = f"Year was not specified - assumed {parsed_date.year}. Verify manually."

    delta_days = (parsed_date - today).days
    if delta_days < 0:
        result["expired"] = True
        result["days_ago"] = abs(delta_days)
        return result

    result["days_remaining"] = delta_days
    result["expiring_soon"] = delta_days <= 3
    return result
