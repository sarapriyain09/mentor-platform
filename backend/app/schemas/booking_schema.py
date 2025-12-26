from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Optional


# ============= BOOKING SCHEMAS =============

class BookingCreate(BaseModel):
    mentor_id: int
    session_date: date
    start_time: time
    duration_minutes: int = Field(..., ge=30, le=240)  # 30min to 4 hours
    mentee_message: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    mentee_id: int
    mentor_id: int
    session_date: date
    start_time: time
    end_time: time
    duration_minutes: int
    status: str
    amount: float
    payment_status: str
    mentee_message: Optional[str]
    meeting_link: Optional[str] = None
    session_summary: Optional[str] = None
    session_summary_submitted_at: Optional[datetime] = None
    mentee_consent: Optional[bool] = None
    mentee_consent_at: Optional[datetime] = None
    mentee_consent_note: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]

    class Config:
        from_attributes = True


class BookingWithDetails(BookingOut):
    """Booking with mentor/mentee names"""
    mentor_name: str
    mentee_name: str
    mentor_email: str
    mentee_email: str


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(confirmed|cancelled|completed)$")
    cancellation_reason: Optional[str] = None
    mentor_notes: Optional[str] = None


# ============= AVAILABILITY SCHEMAS =============

class AvailabilityCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Mon, 6=Sun
    start_time: time
    end_time: time


class AvailabilityOut(BaseModel):
    id: int
    mentor_id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AvailabilityUpdate(BaseModel):
    is_active: bool


# ============= BLOCKED DATE SCHEMAS =============

class BlockedDateCreate(BaseModel):
    blocked_date: date
    reason: Optional[str] = None


class BlockedDateOut(BaseModel):
    id: int
    mentor_id: int
    blocked_date: date
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============= AVAILABLE SLOTS RESPONSE =============

class AvailableSlot(BaseModel):
    """Available time slot for a specific date"""
    date: date
    start_time: time
    end_time: time
    duration_minutes: int


class AvailableSlotsResponse(BaseModel):
    mentor_id: int
    available_slots: list[AvailableSlot]