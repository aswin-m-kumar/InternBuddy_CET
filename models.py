from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(512))
    provider = db.Column(db.String(50))  # 'local' for the small-scale version
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Profile data from resume
    education = db.Column(db.JSON)  # {degree, branch, year, cgpa}
    skills = db.Column(db.JSON)  # List of skills
    experience = db.Column(db.Text)
    projects = db.Column(db.JSON)  # List of projects
    resume_path = db.Column(db.String(512))

    # Relationships
    saved_internships = db.relationship('SavedInternship', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='user', lazy='dynamic', cascade='all, delete-orphan')

class Internship(db.Model):
    __tablename__ = 'internships'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    company = db.Column(db.String(255), nullable=False, index=True)
    source = db.Column(db.String(50))  # 'linkedin', 'internship_cell', 'other'
    source_url = db.Column(db.String(1024), unique=True, nullable=False)

    # Job details
    description = db.Column(db.Text)
    eligibility = db.Column(db.Text)  # Parsed eligibility criteria
    required_skills = db.Column(db.JSON)  # List of required skills
    location = db.Column(db.String(255))
    duration = db.Column(db.String(100))
    stipend = db.Column(db.String(100))
    deadline = db.Column(db.DateTime)
    posted_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Metadata
    is_active = db.Column(db.Boolean, default=True)
    raw_data = db.Column(db.Text)  # Original scraped content

    # Relationships
    saved_by = db.relationship('SavedInternship', backref='internship', lazy='dynamic', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='internship', lazy='dynamic', cascade='all, delete-orphan')


class SavedInternship(db.Model):
    __tablename__ = 'saved_internships'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'internship_id', name='unique_saved'),)


class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'), nullable=False)
    status = db.Column(db.String(50), default='applied')  # applied, shortlisted, rejected, accepted
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)

    __table_args__ = (db.UniqueConstraint('user_id', 'internship_id', name='unique_application'),)


class UsageLog(db.Model):
    __tablename__ = 'usage_logs'

    id = db.Column(db.Integer, primary_key=True)
    endpoint = db.Column(db.String(100), nullable=False, index=True)
    model_used = db.Column(db.String(100))
    tokens_estimate = db.Column(db.Integer, default=0)
    cached = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


def init_db(app):
    db.init_app(app)

    with app.app_context():
        db.create_all()
