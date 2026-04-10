import logging
from openai import OpenAI

logger = logging.getLogger(__name__)


def calculate_eligibility_score(user_profile, internship, api_key):
    """
    Calculate how well a user matches an internship.
    Returns a score (0-100) and detailed breakdown.
    """
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

    user_context = f"""
    - Degree: {user_profile.get('education', {}).get('degree', 'N/A')}
    - Branch: {user_profile.get('education', {}).get('branch', 'N/A')}
    - Year: {user_profile.get('education', {}).get('year', 'N/A')}
    - CGPA: {user_profile.get('education', {}).get('cgpa', 'N/A')}
    - Skills: {', '.join(user_profile.get('skills', []))}
    - Experience: {user_profile.get('experience', 'N/A')}
    - Projects: {', '.join(user_profile.get('projects', []))}
    """

    job_context = f"""
    - Title: {internship.title}
    - Company: {internship.company}
    - Eligibility: {internship.eligibility or 'Not specified'}
    - Required Skills: {', '.join(internship.required_skills or [])}
    - Location: {internship.location or 'Not specified'}
    - Duration: {internship.duration or 'Not specified'}
    """

    prompt = f"""
    Compare this student profile with the internship requirements and return ONLY valid JSON:
    {{
        "score": 0-100,
        "eligible": true/false,
        "breakdown": {{
            "education_match": 0-100,
            "skills_match": 0-100,
            "experience_relevance": 0-100
        }},
        "matching_skills": ["skill1", "skill2"],
        "missing_skills": ["skill3", "skill4"],
        "reason": "brief explanation of the score"
    }}

    Student Profile:
    {user_context}

    Internship:
    {job_context}

    Be strict but fair. A score of 70+ means the student should apply.
    """

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[
                {"role": "system", "content": "Return eligibility assessment as JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.1
        )

        content = response.choices[0].message.content.strip()
        if content.startswith('```'):
            import re
            content = re.sub(r'^```(?:json)?\n?', '', content)
            content = re.sub(r'\n?```$', '', content)

        import json
        result = json.loads(content)

        return {
            'score': result.get('score', 0),
            'eligible': result.get('eligible', False),
            'breakdown': result.get('breakdown', {}),
            'matching_skills': result.get('matching_skills', []),
            'missing_skills': result.get('missing_skills', []),
            'reason': result.get('reason', '')
        }

    except Exception as e:
        logger.error(f"Eligibility scoring error: {e}")
        # Fallback: simple keyword matching
        return fallback_eligibility_check(user_profile, internship)


def fallback_eligibility_check(user_profile, internship):
    """Simple keyword-based matching when AI is unavailable."""
    user_skills = set(s.lower() for s in user_profile.get('skills', []))
    required_skills = set(s.lower() for s in (internship.required_skills or []))

    if not required_skills:
        skills_match = 100
    else:
        matching = user_skills & required_skills
        skills_match = int((len(matching) / len(required_skills)) * 100) if required_skills else 0

    score = skills_match
    eligible = score >= 50

    return {
        'score': score,
        'eligible': eligible,
        'breakdown': {
            'skills_match': skills_match,
            'education_match': 50,
            'experience_relevance': 50
        },
        'matching_skills': list(user_skills & required_skills),
        'missing_skills': list(required_skills - user_skills),
        'reason': f"Matched {len(user_skills & required_skills)} of {len(required_skills)} required skills"
    }


def search_internships(query, filters=None):
    """
    Build search query for internships.
    Returns SQLAlchemy filter conditions.
    """
    from models import Internship
    from sqlalchemy import or_, and_

    conditions = [Internship.is_active == True]

    if query:
        search_terms = query.split()
        search_conditions = []
        for term in search_terms:
            search_conditions.append(Internship.title.ilike(f'%{term}%'))
            search_conditions.append(Internship.company.ilike(f'%{term}%'))
            search_conditions.append(Internship.description.ilike(f'%{term}%'))
        conditions.append(or_(*search_conditions))

    if filters:
        if filters.get('location'):
            conditions.append(Internship.location.ilike(f'%{filters["location"]}%'))
        if filters.get('min_score'):
            # This would need to be calculated per-user, handled separately
            pass
        if filters.get('duration'):
            conditions.append(Internship.duration.ilike(f'%{filters["duration"]}%'))

    return and_(*conditions)
