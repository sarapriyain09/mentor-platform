from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, date, time, timedelta
from typing import Optional
from pydantic import ValidationError
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.booking import Booking, Availability, BlockedDate
from app.models.profile import MentorProfile
from app.schemas.booking_schema import (
    BookingCreate, BookingOut, BookingWithDetails, BookingStatusUpdate,
    AvailabilityCreate, AvailabilityOut, AvailabilityUpdate,
    BlockedDateCreate, BlockedDateOut,
    AvailableSlot, AvailableSlotsResponse
)

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


def _safe_booking_out_dict(booking: Booking) -> dict:
    """Return a BookingOut-shaped dict with defensive defaults.

    Some older rows may have NULLs for fields that are required in the current
    Pydantic schema (e.g. payment_status). This prevents a 500 in list/detail.
    """
    try:
        return BookingOut.model_validate(booking).model_dump()
    except ValidationError:
        return {
            "id": booking.id,
            "mentee_id": booking.mentee_id,
            "mentor_id": booking.mentor_id,
            "session_date": booking.session_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "duration_minutes": booking.duration_minutes,
            "status": booking.status or "requested",
            "amount": float(booking.amount or 0.0),
            "payment_status": booking.payment_status or "pending",
            "mentee_message": booking.mentee_message,
            "created_at": booking.created_at,
            "confirmed_at": booking.confirmed_at,
            "completed_at": booking.completed_at,
            "cancelled_at": booking.cancelled_at,
            "cancellation_reason": booking.cancellation_reason,
        }


# ============= HELPER FUNCTIONS =============

def calculate_end_time(start_time: time, duration_minutes: int) -> time:
    """Calculate end time from start time + duration"""
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    return end_dt.time()


def check_booking_conflict(
    db: Session,
    mentor_id: int,
    session_date: date,
    start_time: time,
    end_time: time,
    exclude_booking_id: Optional[int] = None
) -> bool:
    """Check if proposed booking conflicts with existing bookings"""
    query = db.query(Booking).filter(
        Booking.mentor_id == mentor_id,
        Booking.session_date == session_date,
        Booking.status.in_(["requested", "confirmed"])  # Only active bookings
    )
    
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    
    existing_bookings = query.all()
    
    for booking in existing_bookings:
        # Check time overlap
        if (start_time < booking.end_time and end_time > booking.start_time):
            return True  # Conflict found
    
    return False  # No conflict


# ============= BOOKING ENDPOINTS =============

@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking (mentee only)"""
    
    # Only mentees can book
    role = (current_user.role or "").lower()
    if role != "mentee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentees can book sessions"
        )
    
    # Validate mentor exists
    mentor = db.query(User).filter(
        User.id == booking_data.mentor_id,
        User.role.ilike("mentor")
    ).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    # Get mentor profile for pricing
    mentor_profile = db.query(MentorProfile).filter(
        MentorProfile.user_id == booking_data.mentor_id
    ).first()
    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    
    # Calculate end time
    end_time = calculate_end_time(booking_data.start_time, booking_data.duration_minutes)
    
    # Check for conflicts
    if check_booking_conflict(
        db, booking_data.mentor_id, booking_data.session_date,
        booking_data.start_time, end_time
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is already booked"
        )
    
    # Check if date is blocked
    blocked = db.query(BlockedDate).filter(
        BlockedDate.mentor_id == booking_data.mentor_id,
        BlockedDate.blocked_date == booking_data.session_date
    ).first()
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mentor is unavailable on this date: {blocked.reason or 'No reason provided'}"
        )
    
    # Calculate amount (hourly_rate * duration in hours)
    amount = mentor_profile.hourly_rate * (booking_data.duration_minutes / 60)
    
    # Create booking
    new_booking = Booking(
        mentee_id=current_user.id,
        mentor_id=booking_data.mentor_id,
        session_date=booking_data.session_date,
        start_time=booking_data.start_time,
        end_time=end_time,
        duration_minutes=booking_data.duration_minutes,
        amount=amount,
        mentee_message=booking_data.mentee_message,
        status="requested"
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return new_booking


@router.get("/my-bookings", response_model=list[BookingWithDetails])
def get_my_bookings(
    status_filter: Optional[str] = Query(None, regex="^(requested|confirmed|completed|cancelled)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bookings for current user (as mentee or mentor)"""
    
    print(f"DEBUG /my-bookings - User ID: {current_user.id}, Email: {getattr(current_user, 'email', None)}, Role: {current_user.role}")
    role = (current_user.role or "").lower()
    if role == "mentee":
        query = db.query(Booking).filter(Booking.mentee_id == current_user.id)
    elif role == "mentor":
        query = db.query(Booking).filter(Booking.mentor_id == current_user.id)
    else:
        print(f"DEBUG /my-bookings - Invalid role: {current_user.role}")
        raise HTTPException(status_code=403, detail="Invalid role")
    
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    
    bookings = query.order_by(Booking.session_date.desc(), Booking.start_time.desc()).all()
    
    # Add mentor/mentee details
    result = []
    for booking in bookings:
        mentor = db.query(User).filter(User.id == booking.mentor_id).first()
        mentee = db.query(User).filter(User.id == booking.mentee_id).first()
        
        booking_dict = _safe_booking_out_dict(booking)
        booking_dict["mentor_name"] = getattr(mentor, "full_name", None) or "Unknown"
        booking_dict["mentee_name"] = getattr(mentee, "full_name", None) or "Unknown"
        booking_dict["mentor_email"] = getattr(mentor, "email", None) or ""
        booking_dict["mentee_email"] = getattr(mentee, "email", None) or ""
        
        result.append(BookingWithDetails(**booking_dict))
    
    return result


@router.get("/{booking_id}", response_model=BookingWithDetails)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific booking details"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check permission
    if booking.mentee_id != current_user.id and booking.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    mentor = db.query(User).filter(User.id == booking.mentor_id).first()
    mentee = db.query(User).filter(User.id == booking.mentee_id).first()
    
    booking_dict = _safe_booking_out_dict(booking)
    booking_dict["mentor_name"] = getattr(mentor, "full_name", None) or "Unknown"
    booking_dict["mentee_name"] = getattr(mentee, "full_name", None) or "Unknown"
    booking_dict["mentor_email"] = getattr(mentor, "email", None) or ""
    booking_dict["mentee_email"] = getattr(mentee, "email", None) or ""
    
    return BookingWithDetails(**booking_dict)


@router.patch("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update booking status (confirm/cancel/complete)"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Permission check
    is_mentor = booking.mentor_id == current_user.id
    is_mentee = booking.mentee_id == current_user.id
    
    if not (is_mentor or is_mentee):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Status transitions
    if status_update.status == "confirmed":
        if not is_mentor:
            raise HTTPException(status_code=403, detail="Only mentor can confirm bookings")
        booking.status = "confirmed"
        booking.confirmed_at = datetime.utcnow()
    
    elif status_update.status == "cancelled":
        if booking.status == "completed":
            raise HTTPException(status_code=400, detail="Cannot cancel completed booking")
        booking.status = "cancelled"
        booking.cancelled_at = datetime.utcnow()
        booking.cancellation_reason = status_update.cancellation_reason
    
    elif status_update.status == "completed":
        if not is_mentor:
            raise HTTPException(status_code=403, detail="Only mentor can mark as completed")
        if booking.status != "confirmed":
            raise HTTPException(status_code=400, detail="Can only complete confirmed bookings")
        booking.status = "completed"
        booking.completed_at = datetime.utcnow()
    
    if status_update.mentor_notes and is_mentor:
        booking.mentor_notes = status_update.mentor_notes
    
    booking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    
    return booking


# ============= AVAILABILITY ENDPOINTS =============

@router.post("/availability", response_model=AvailabilityOut, status_code=status.HTTP_201_CREATED)
def create_availability(
    availability_data: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create availability slot (mentor only)"""
    
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can set availability")
    
    # Check for overlapping slots
    existing = db.query(Availability).filter(
        Availability.mentor_id == current_user.id,
        Availability.day_of_week == availability_data.day_of_week,
        Availability.is_active == True
    ).all()
    
    for slot in existing:
        if (availability_data.start_time < slot.end_time and 
            availability_data.end_time > slot.start_time):
            raise HTTPException(
                status_code=400,
                detail="This overlaps with an existing availability slot"
            )
    
    new_slot = Availability(
        mentor_id=current_user.id,
        day_of_week=availability_data.day_of_week,
        start_time=availability_data.start_time,
        end_time=availability_data.end_time
    )
    
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    
    return new_slot


@router.get("/availability/my-slots", response_model=list[AvailabilityOut])
def get_my_availability(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get mentor's own availability slots"""
    
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors have availability")
    
    slots = db.query(Availability).filter(
        Availability.mentor_id == current_user.id
    ).order_by(Availability.day_of_week, Availability.start_time).all()
    
    return slots


@router.get("/availability/mentor/{mentor_id}", response_model=AvailableSlotsResponse)
def get_mentor_available_slots(
    mentor_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db)
):
    """Get mentor's available time slots for date range"""
    
    # Validate mentor
    mentor = db.query(User).filter(User.id == mentor_id, User.role == "mentor").first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    # Get availability patterns
    availability_slots = db.query(Availability).filter(
        Availability.mentor_id == mentor_id,
        Availability.is_active == True
    ).all()
    
    if not availability_slots:
        return AvailableSlotsResponse(mentor_id=mentor_id, available_slots=[])
    
    # Get blocked dates
    blocked_dates = db.query(BlockedDate).filter(
        BlockedDate.mentor_id == mentor_id,
        BlockedDate.blocked_date.between(start_date, end_date)
    ).all()
    blocked_date_list = [bd.blocked_date for bd in blocked_dates]
    
    # Get existing bookings
    existing_bookings = db.query(Booking).filter(
        Booking.mentor_id == mentor_id,
        Booking.session_date.between(start_date, end_date),
        Booking.status.in_(["requested", "confirmed"])
    ).all()
    
    # Generate available slots
    available_slots = []
    current_date = start_date
    
    while current_date <= end_date:
        # Skip blocked dates
        if current_date in blocked_date_list:
            current_date += timedelta(days=1)
            continue
        
        # Get day of week (0=Monday)
        day_of_week = current_date.weekday()
        
        # Find availability for this day
        day_availability = [a for a in availability_slots if a.day_of_week == day_of_week]
        
        for av_slot in day_availability:
            # Check if this slot is booked
            is_booked = False
            for booking in existing_bookings:
                if (booking.session_date == current_date and
                    booking.start_time < av_slot.end_time and
                    booking.end_time > av_slot.start_time):
                    is_booked = True
                    break
            
            if not is_booked:
                # Calculate duration
                start_dt = datetime.combine(current_date, av_slot.start_time)
                end_dt = datetime.combine(current_date, av_slot.end_time)
                duration = int((end_dt - start_dt).total_seconds() / 60)
                
                available_slots.append(AvailableSlot(
                    date=current_date,
                    start_time=av_slot.start_time,
                    end_time=av_slot.end_time,
                    duration_minutes=duration
                ))
        
        current_date += timedelta(days=1)
    
    return AvailableSlotsResponse(
        mentor_id=mentor_id,
        available_slots=available_slots
    )


@router.patch("/availability/{slot_id}", response_model=AvailabilityOut)
def update_availability_slot(
    slot_id: int,
    update_data: AvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Activate/deactivate availability slot"""
    
    slot = db.query(Availability).filter(Availability.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    if slot.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your availability slot")
    
    slot.is_active = update_data.is_active
    slot.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(slot)
    
    return slot


@router.delete("/availability/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete availability slot"""
    
    slot = db.query(Availability).filter(Availability.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    if slot.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your availability slot")
    
    db.delete(slot)
    db.commit()
    
    return None


# ============= BLOCKED DATES ENDPOINTS =============

@router.post("/blocked-dates", response_model=BlockedDateOut, status_code=status.HTTP_201_CREATED)
def create_blocked_date(
    blocked_data: BlockedDateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Block a specific date (mentor only)"""
    
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can block dates")
    
    # Check if already blocked
    existing = db.query(BlockedDate).filter(
        BlockedDate.mentor_id == current_user.id,
        BlockedDate.blocked_date == blocked_data.blocked_date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="This date is already blocked")
    
    blocked = BlockedDate(
        mentor_id=current_user.id,
        blocked_date=blocked_data.blocked_date,
        reason=blocked_data.reason
    )
    
    db.add(blocked)
    db.commit()
    db.refresh(blocked)
    
    return blocked


@router.get("/blocked-dates/my-dates", response_model=list[BlockedDateOut])
def get_my_blocked_dates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get mentor's blocked dates"""
    
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors have blocked dates")
    
    blocked_dates = db.query(BlockedDate).filter(
        BlockedDate.mentor_id == current_user.id
    ).order_by(BlockedDate.blocked_date).all()
    
    return blocked_dates


@router.delete("/blocked-dates/{blocked_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blocked_date(
    blocked_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unblock a date"""
    
    blocked = db.query(BlockedDate).filter(BlockedDate.id == blocked_id).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="Blocked date not found")
    
    if blocked.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your blocked date")
    
    db.delete(blocked)
    db.commit()
    
    return None