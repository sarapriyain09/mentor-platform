from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean, Time, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Booking(Base):
    """Session bookings between mentee and mentor"""
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session details
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)  # 30, 60, 90, 120
    
    # Status workflow
    status = Column(String, default="requested")  
    # requested -> confirmed -> completed / cancelled
    
    # Payment
    amount = Column(Float, nullable=False)  # Total amount in GBP
    payment_status = Column(String, default="pending")  # pending, paid, refunded
    payment_intent_id = Column(String, nullable=True)  # Stripe payment ID
    
    # Notes
    mentee_message = Column(String, nullable=True)  # Why booking
    mentor_notes = Column(String, nullable=True)  # Private notes

    # Session closeout (Zoom/Meet + summary + consent)
    meeting_link = Column(String, nullable=True)
    session_summary = Column(String, nullable=True)
    session_summary_submitted_at = Column(DateTime, nullable=True)
    mentee_consent = Column(Boolean, nullable=True)  # None=pending, True=approved, False=declined
    mentee_consent_at = Column(DateTime, nullable=True)
    mentee_consent_note = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(String, nullable=True)
    
    # Relationships
    mentee = relationship("User", foreign_keys=[mentee_id], backref="bookings_as_mentee")
    mentor = relationship("User", foreign_keys=[mentor_id], backref="bookings_as_mentor")


class Availability(Base):
    """Mentor availability slots"""
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Day of week (0=Monday, 6=Sunday)
    day_of_week = Column(Integer, nullable=False)  # 0-6
    
    # Time slots
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Active/inactive
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    mentor = relationship("User", backref="availability_slots")


class BlockedDate(Base):
    """Mentor blocked dates (holidays, unavailable days)"""
    __tablename__ = "blocked_dates"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    blocked_date = Column(Date, nullable=False)
    reason = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    mentor = relationship("User", backref="blocked_dates")