# app/schemas/feedback_schema.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SessionCompleteRequest(BaseModel):
    """Request to mark session as complete (mentor only)"""
    booking_id: int


class FeedbackCreateRequest(BaseModel):
    """Request to submit feedback (mentee only)"""
    booking_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    feedback_text: Optional[str] = Field(None, max_length=1000, description="Optional written feedback")


class FeedbackResponse(BaseModel):
    """Feedback response"""
    id: int
    booking_id: int
    rating: int
    feedback_text: Optional[str]
    mentee_id: int
    mentor_id: int
    session_completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class MentorRatingsSummary(BaseModel):
    """Summary of mentor ratings"""
    mentor_id: int
    total_sessions: int
    average_rating: float
    five_star: int
    four_star: int
    three_star: int
    two_star: int
    one_star: int
