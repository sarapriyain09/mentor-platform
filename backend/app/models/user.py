from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship  # <-- Add this line
from app.database import Base

import enum


class UserRole(str, enum.Enum):
    mentor = "mentor"
    mentee = "mentee"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)
    mentee_profile = relationship("MenteeProfile", back_populates="user", uselist=False)

# app/models/user.py
from sqlalchemy import Column, Integer, String
from app.database import Base

