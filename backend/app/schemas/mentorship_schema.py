from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Mentorship Request Schemas
class MentorshipRequestCreate(BaseModel):
    mentor_id: int
    message: Optional[str] = None


class MentorshipRequestOut(BaseModel):
    id: int
    mentee_id: int
    mentor_id: int
    message: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MentorshipRequestWithDetails(BaseModel):
    id: int
    mentee_id: int
    mentor_id: int
    message: Optional[str]
    status: str
    created_at: datetime
    mentee_name: Optional[str] = None
    mentor_name: Optional[str] = None

    class Config:
        from_attributes = True


# Mentorship Schemas
class MentorshipCreate(BaseModel):
    mentee_id: int
    notes: Optional[str] = None


class MentorshipOut(BaseModel):
    id: int
    mentor_id: int
    mentee_id: int
    start_date: datetime
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True


class MentorshipWithDetails(BaseModel):
    id: int
    mentor_id: int
    mentee_id: int
    start_date: datetime
    status: str
    notes: Optional[str]
    mentor_name: Optional[str] = None
    mentee_name: Optional[str] = None

    class Config:
        from_attributes = True
