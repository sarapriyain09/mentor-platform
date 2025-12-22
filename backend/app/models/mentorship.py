from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class MentorshipRequest(Base):
    __tablename__ = "mentorship_requests"

    id = Column(Integer, primary_key=True, index=True)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text)
    status = Column(String, default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    mentee = relationship("User", foreign_keys=[mentee_id], backref="sent_requests")
    mentor = relationship("User", foreign_keys=[mentor_id], backref="received_requests")


class Mentorship(Base):
    __tablename__ = "mentorships"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")  # active, completed, cancelled
    notes = Column(Text)

    # Relationships
    mentor = relationship("User", foreign_keys=[mentor_id], backref="mentorships_as_mentor")
    mentee = relationship("User", foreign_keys=[mentee_id], backref="mentorships_as_mentee")
