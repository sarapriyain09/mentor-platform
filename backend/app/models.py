# app/models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


# =========================
# User (Week 1)
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # mentor / mentee
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    mentor_profile = relationship(
        "MentorProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete"
    )

    mentee_profile = relationship(
        "MenteeProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete"
    )


# =========================
# Mentor Profile (Week 2)
# =========================
class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    bio = Column(String)
    expertise = Column(String)
    availability = Column(String)

    user = relationship("User", back_populates="mentor_profile")


# =========================
# Mentee Profile (Week 2)
# =========================
class MenteeProfile(Base):
    __tablename__ = "mentee_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    goals = Column(String)
    interests = Column(String)

    user = relationship("User", back_populates="mentee_profile")


# =========================
# Mentoring Sessions (Week 2)
# =========================
class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    mentor_id = Column(Integer, ForeignKey("mentor_profiles.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("mentee_profiles.id"), nullable=False)

    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # pending | confirmed | completed
    created_at = Column(DateTime, default=datetime.utcnow)
