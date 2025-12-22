from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    full_name = Column(String)
    domains = Column(String)          # "Mechanical, Electrical"
    skills = Column(String)           # "CAD, Python"
    years_experience = Column(Integer)
    bio = Column(String)
    hourly_rate = Column(Float)
    availability = Column(String)     # "Mon-Fri 6pm-9pm"
    is_verified = Column(Boolean, default=False)

    user = relationship("User", back_populates="mentor_profile")


class MenteeProfile(Base):
    __tablename__ = "mentee_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    name = Column(String)
    goals = Column(String)
    background = Column(String)

    user = relationship("User", back_populates="mentee_profile")
