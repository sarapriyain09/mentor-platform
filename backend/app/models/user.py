from sqlalchemy import Column, Integer, String, Enum, DateTime
from app.database import Base
from sqlalchemy.orm import relationship
import enum


class UserRole(str, enum.Enum):
    mentor = "mentor"
    mentee = "mentee"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    role = Column(String)
    password = Column(String)
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)

    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)
    mentee_profile = relationship("MenteeProfile", back_populates="user", uselist=False)