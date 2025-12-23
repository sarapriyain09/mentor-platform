# backend/app/models/mentee_intake.py
"""
AI Agent Intake and Matching Models
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class MenteeIntake(Base):
    """Enhanced intake data collected via AI agent"""
    __tablename__ = "mentee_intakes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Core structured fields for matching
    career_stage = Column(String)  # "student", "early_career", "mid_level", "senior", "career_change"
    primary_goal = Column(String)  # "skill_development", "career_transition", "leadership", "entrepreneurship"
    specific_goal = Column(Text)   # Refined goal statement
    
    desired_skills = Column(String)  # Comma-separated skills to learn
    current_skills = Column(String)  # Current skill level
    industry_interest = Column(String)  # Target industry/domain
    
    time_commitment = Column(String)  # "1hr/week", "2-3hrs/week", "flexible"
    budget_range = Column(String)     # "0-50", "50-100", "100+"
    timeline = Column(String)         # "3_months", "6_months", "12_months"
    
    preferred_mentor_style = Column(String)  # "hands_on", "advisory", "accountability"
    communication_preference = Column(String)  # "video", "chat", "both"
    
    # Enhanced fields
    current_challenges = Column(Text)  # What's blocking them
    past_experience = Column(Text)     # Relevant background
    learning_style = Column(String)    # "visual", "practical", "theoretical"
    
    # AI conversation metadata
    conversation_summary = Column(Text)
    matching_signals = Column(JSON)  # Additional structured data for matching
    conversation_log = Column(JSON)  # Full conversation history
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="intake_data")


class MentorMatch(Base):
    """AI-generated mentor recommendations for mentees"""
    __tablename__ = "mentor_matches"

    id = Column(Integer, primary_key=True, index=True)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    match_score = Column(Integer)  # 0-100
    match_reasons = Column(JSON)   # List of why this mentor matches
    match_metadata = Column(JSON)  # Additional matching details
    
    is_viewed = Column(Boolean, default=False)
    is_contacted = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    mentee = relationship("User", foreign_keys=[mentee_id], backref="recommended_mentors")
    mentor = relationship("User", foreign_keys=[mentor_id], backref="mentee_matches")