# app/routes/feedback_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.feedback import SessionFeedback
from app.models.booking import Booking
from app.models.user import User
from app.schemas.feedback_schema import (
    SessionCompleteRequest,
    FeedbackCreateRequest,
    FeedbackResponse,
    MentorRatingsSummary
)
from app.utils.auth_utils import get_current_user, require_role
from datetime import datetime

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/complete-session")
async def complete_session(
    request: SessionCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("mentor"))
):
    """Mentor marks session as complete"""
    
    # Verify booking belongs to this mentor
    booking = db.query(Booking).filter(Booking.id == request.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="This booking doesn't belong to you")
    
    # Check if already completed
    existing_feedback = db.query(SessionFeedback).filter(
        SessionFeedback.booking_id == request.booking_id
    ).first()
    
    if existing_feedback and existing_feedback.session_completed_at:
        raise HTTPException(status_code=400, detail="Session already marked as complete")
    
    # Create or update feedback record
    if existing_feedback:
        existing_feedback.session_completed_at = datetime.utcnow()
    else:
        feedback = SessionFeedback(
            booking_id=request.booking_id,
            mentee_id=booking.mentee_id,
            mentor_id=booking.mentor_id,
            rating=0,  # Will be set when mentee submits feedback
            session_completed_at=datetime.utcnow()
        )
        db.add(feedback)
    
    # Update booking status
    booking.status = "completed"
    
    db.commit()
    
    return {"message": "Session marked as complete. Mentee can now submit feedback."}


@router.post("/submit", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("mentee"))
):
    """Mentee submits feedback and rating"""
    
    # Verify booking belongs to this mentee
    booking = db.query(Booking).filter(Booking.id == request.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.mentee_id != current_user.id:
        raise HTTPException(status_code=403, detail="This booking doesn't belong to you")
    
    # Check if session is completed
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Session must be marked complete by mentor first")
    
    # Check if feedback already exists
    existing_feedback = db.query(SessionFeedback).filter(
        SessionFeedback.booking_id == request.booking_id
    ).first()
    
    if existing_feedback and existing_feedback.rating > 0:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this session")
    
    # Create or update feedback
    if existing_feedback:
        existing_feedback.rating = request.rating
        existing_feedback.feedback_text = request.feedback_text
        existing_feedback.updated_at = datetime.utcnow()
        feedback = existing_feedback
    else:
        feedback = SessionFeedback(
            booking_id=request.booking_id,
            rating=request.rating,
            feedback_text=request.feedback_text,
            mentee_id=current_user.id,
            mentor_id=booking.mentor_id
        )
        db.add(feedback)
    
    db.commit()
    db.refresh(feedback)
    
    return feedback


@router.get("/mentor/{mentor_id}/ratings", response_model=MentorRatingsSummary)
async def get_mentor_ratings(mentor_id: int, db: Session = Depends(get_db)):
    """Get mentor's rating summary"""
    
    # Get all feedback for this mentor
    feedbacks = db.query(SessionFeedback).filter(
        SessionFeedback.mentor_id == mentor_id,
        SessionFeedback.rating > 0
    ).all()
    
    if not feedbacks:
        return MentorRatingsSummary(
            mentor_id=mentor_id,
            total_sessions=0,
            average_rating=0.0,
            five_star=0,
            four_star=0,
            three_star=0,
            two_star=0,
            one_star=0
        )
    
    # Calculate stats
    total = len(feedbacks)
    ratings = [f.rating for f in feedbacks]
    average = sum(ratings) / total
    
    return MentorRatingsSummary(
        mentor_id=mentor_id,
        total_sessions=total,
        average_rating=round(average, 2),
        five_star=ratings.count(5),
        four_star=ratings.count(4),
        three_star=ratings.count(3),
        two_star=ratings.count(2),
        one_star=ratings.count(1)
    )


@router.get("/mentor/{mentor_id}/feedback")
async def get_mentor_feedback(
    mentor_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get mentor's feedback with pagination"""
    
    feedbacks = db.query(SessionFeedback).filter(
        SessionFeedback.mentor_id == mentor_id,
        SessionFeedback.rating > 0,
        SessionFeedback.feedback_text.isnot(None)
    ).order_by(SessionFeedback.created_at.desc()).offset(skip).limit(limit).all()
    
    return feedbacks


@router.get("/my-feedback")
async def get_my_feedback_received(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("mentor"))
):
    """Get all feedback received by current mentor"""
    
    feedbacks = db.query(SessionFeedback).filter(
        SessionFeedback.mentor_id == current_user.id,
        SessionFeedback.rating > 0
    ).order_by(SessionFeedback.created_at.desc()).all()
    
    return feedbacks
