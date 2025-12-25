# app/models/feedback.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class SessionFeedback(Base):
    """Feedback and ratings for completed mentoring sessions"""
    __tablename__ = "session_feedback"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    
    # Rating (1-5 stars)
    rating = Column(Integer, nullable=False)  # 1-5
    
    # Optional written feedback
    feedback_text = Column(Text, nullable=True)
    
    # Submitted by mentee
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # About mentor
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session marked complete by mentor
    session_completed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    booking = relationship("Booking", backref="feedback")
    mentee = relationship("User", foreign_keys=[mentee_id], backref="feedback_given")
    mentor = relationship("User", foreign_keys=[mentor_id], backref="feedback_received")
