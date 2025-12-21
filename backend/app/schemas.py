# app/schemas.py

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# =========================
# Week 1 – Authentication
# =========================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str  # mentor / mentee


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# =========================
# Week 2 – Mentor Profile
# =========================
class MentorProfileCreate(BaseModel):
    bio: Optional[str] = None
    expertise: str
    availability: Optional[str] = None


class MentorProfileResponse(BaseModel):
    id: int
    bio: Optional[str]
    expertise: str
    availability: Optional[str]

    class Config:
        from_attributes = True


# =========================
# Week 2 – Mentee Profile
# =========================
class MenteeProfileCreate(BaseModel):
    goals: Optional[str] = None
    interests: Optional[str] = None


class MenteeProfileResponse(BaseModel):
    id: int
    goals: Optional[str]
    interests: Optional[str]

    class Config:
        from_attributes = True


# =========================
# Week 2 – Sessions
# =========================
class SessionCreate(BaseModel):
    mentor_id: int
    scheduled_at: datetime


class SessionResponse(BaseModel):
    id: int
    mentor_id: int
    mentee_id: int
    scheduled_at: datetime
    status: str

    class Config:
        from_attributes = True
