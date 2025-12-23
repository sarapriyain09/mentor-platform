# backend/app/schemas/intake_schema.py
"""
Schemas for AI Agent Intake
"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class AIMessage(BaseModel):
    """Single message in AI conversation"""
    role: str  # "ai" or "user"
    content: str
    timestamp: Optional[datetime] = None


class AIConversationRequest(BaseModel):
    """User message to AI agent"""
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []


class AIConversationResponse(BaseModel):
    """AI agent response"""
    message: str
    question_type: Optional[str] = None  # "career_stage", "goals", "skills", etc.
    is_complete: bool = False  # True when enough data collected


class MenteeIntakeCreate(BaseModel):
    """Create intake from AI conversation"""
    career_stage: Optional[str] = ""
    primary_goal: Optional[str] = ""
    specific_goal: Optional[str] = ""
    desired_skills: Optional[str] = ""
    current_skills: Optional[str] = ""
    industry_interest: Optional[str] = ""
    time_commitment: Optional[str] = ""
    budget_range: Optional[str] = ""
    timeline: Optional[str] = ""
    preferred_mentor_style: Optional[str] = "advisory"
    communication_preference: Optional[str] = "both"
    current_challenges: Optional[str] = ""
    past_experience: Optional[str] = ""
    learning_style: Optional[str] = ""
    conversation_summary: Optional[str] = ""
    matching_signals: Optional[dict] = {}
    conversation_log: Optional[list] = []


class MenteeIntakeOut(BaseModel):
    """Output schema for intake"""
    id: int
    user_id: int
    career_stage: Optional[str]
    primary_goal: Optional[str]
    specific_goal: Optional[str]
    desired_skills: Optional[str]
    current_skills: Optional[str]
    industry_interest: Optional[str]
    time_commitment: Optional[str]
    budget_range: Optional[str]
    timeline: Optional[str]
    preferred_mentor_style: Optional[str]
    communication_preference: Optional[str]
    current_challenges: Optional[str]
    conversation_summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MentorMatchOut(BaseModel):
    """Mentor recommendation with match details"""
    mentor_id: int
    mentor_name: str
    mentor_domains: str
    mentor_skills: str
    mentor_experience: int
    mentor_bio: str
    mentor_rate: float
    mentor_availability: str
    is_verified: bool
    
    match_score: int
    match_reasons: List[str]

    class Config:
        from_attributes = True