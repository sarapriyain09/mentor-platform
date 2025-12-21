from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

# -------------------------
# Mentor Profile
# -------------------------
class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    expertise = Column(String, nullable=False)
    bio = Column(String, nullable=True)

    user = relationship("User", back_populates="mentor_profile")


# -------------------------
# Mentee Profile
# -------------------------
class MenteeProfile(Base):
    __tablename__ = "mentee_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    goals = Column(String, nullable=False)
    bio = Column(String, nullable=True)

    user = relationship("User", back_populates="mentee_profile")

