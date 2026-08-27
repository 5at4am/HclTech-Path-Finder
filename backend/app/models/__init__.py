from __future__ import annotations

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from ..database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    domain = Column(String, nullable=False)


class Resource(Base):
    """Courses, projects, assessments and articles that make up a path."""

    __tablename__ = "resources"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # course | project | assessment | article
    domain = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)  # beginner | intermediate | advanced
    duration_hours = Column(Integer, nullable=False, default=0)
    format = Column(String, nullable=False, default="video")  # video | text | interactive | hands-on
    description = Column(Text, default="")
    skills_gained = Column(JSON, default=list)
    prerequisites = Column(JSON, default=list)  # resource ids
    phase = Column(String, default="Core")
    optional = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)


class Learner(Base):
    __tablename__ = "learners"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, default="Learner")
    goal = Column(Text, default="")
    target_role = Column(String, default="")
    timeline_months = Column(Integer, default=6)
    interests = Column(JSON, default=list)
    experience_level = Column(String, default="beginner")  # beginner | intermediate | advanced
    current_skills = Column(JSON, default=dict)  # {skill_id: 0-100}
    completed_courses = Column(JSON, default=list)
    objectives = Column(JSON, default=list)
    study_time_per_week = Column(Integer, default=6)
    preferred_format = Column(String, default="video")
    preferred_pace = Column(String, default="moderate")  # slow | moderate | fast
    difficulty_preference = Column(String, default="medium")  # easy | medium | hard
    learning_history = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc))
    updated_at = Column(DateTime, default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
                        onupdate=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc))


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    goal = Column(Text, default="")
    target_role = Column(String, default="")
    timeline_months = Column(Integer, default=6)
    study_time_per_week = Column(Integer, default=6)
    created_at = Column(DateTime, default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc))


class LearningStep(Base):
    __tablename__ = "learning_steps"

    id = Column(String, primary_key=True)
    path_id = Column(String, ForeignKey("learning_paths.id"), nullable=False)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=False)
    order = Column(Integer, default=0)
    phase = Column(String, default="Core")
    status = Column(String, default="recommended")  # completed | current | recommended | locked | optional
    completion_percentage = Column(Integer, default=0)
    estimated_hours = Column(Integer, default=0)
    milestone = Column(Boolean, default=False)
    recommendation_score = Column(Float, default=0.0)
    reason = Column(Text, default="")
    prerequisites = Column(JSON, default=list)
    skills_gained = Column(JSON, default=list)


class Progress(Base):
    __tablename__ = "progress"

    id = Column(String, primary_key=True, default=lambda: __import__("uuid").uuid4().hex)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=False)
    completion_percentage = Column(Integer, default=0)
    status = Column(String, default="recommended")
    time_spent_hours = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
                        onupdate=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc))


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=lambda: __import__("uuid").uuid4().hex)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=False)
    helpful = Column(Boolean, default=True)
    reason = Column(String, default="")  # too_difficult | already_know | not_interested | too_long | not_relevant | other
    created_at = Column(DateTime, default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc))


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: __import__("uuid").uuid4().hex)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    role = Column(String, nullable=False)  # user | assistant
    message = Column(Text, default="")
    sources = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc))


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: __import__("uuid").uuid4().hex)
    email = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False, default="")
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc))
