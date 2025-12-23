# backend/app/routes/ai_agent_routes.py
"""
AI Agent Routes for Mentee Intake and Matching
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.mentee_intake import MenteeIntake, MentorMatch
from app.models.profile import MentorProfile
from app.schemas.intake_schema import (
    AIConversationRequest,
    AIConversationResponse,
    MenteeIntakeCreate,
    MenteeIntakeOut,
    MentorMatchOut
)
from app.utils.ai_agent import EnhancedIntakeAgent, calculate_enhanced_match_score
from typing import List
from datetime import datetime

router = APIRouter(
    prefix="/ai-agent",
    tags=["AI Agent"]
)


@router.post("/chat", response_model=AIConversationResponse)
def chat_with_agent(
    request: AIConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced conversational endpoint with context awareness"""
    if current_user.role != "mentee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentees can use the AI intake agent"
        )
    
    agent = EnhancedIntakeAgent()
    step = len(request.conversation_history)
    
    extracted_data = {}
    followup_question = None
    
    if request.message and step > 0:
        extracted_data = agent.parse_response(step - 1, request.message)
        followup_question = extracted_data.get("followup_question")
    
    if followup_question:
        return AIConversationResponse(
            message=followup_question,
            question_type="followup",
            is_complete=False
        )
    
    next_q = agent.get_next_question(step)
    
    if next_q is None:
        return AIConversationResponse(
            message="🎉 Perfect! I have everything I need.\n\nLet me analyze our conversation and find the best mentors for you...\n\n⏳ This will just take a moment...",
            is_complete=True,
            question_type="complete"
        )
    
    return AIConversationResponse(
        message=next_q["question"],
        question_type=next_q["type"],
        is_complete=False
    )


@router.post("/intake", response_model=MenteeIntakeOut, status_code=status.HTTP_201_CREATED)
def create_or_update_intake(
    intake_data: MenteeIntakeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save or update completed intake data"""
    if current_user.role != "mentee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentees can create intake profiles"
        )
    
    existing = db.query(MenteeIntake).filter(
        MenteeIntake.user_id == current_user.id
    ).first()
    
    if existing:
        for key, value in intake_data.dict(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    new_intake = MenteeIntake(
        user_id=current_user.id,
        **intake_data.dict()
    )
    db.add(new_intake)
    db.commit()
    db.refresh(new_intake)
    
    return new_intake


@router.get("/intake/me", response_model=MenteeIntakeOut)
def get_my_intake(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's intake data"""
    intake = db.query(MenteeIntake).filter(
        MenteeIntake.user_id == current_user.id
    ).first()
    
    if not intake:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No intake found. Complete the AI intake process first."
        )
    
    return intake


@router.get("/matches", response_model=List[MentorMatchOut])
def get_ai_mentor_matches(
    limit: int = 5,
    min_score: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-recommended mentors with enhanced matching algorithm"""
    if current_user.role != "mentee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentees can get mentor matches"
        )
    
    intake = db.query(MenteeIntake).filter(
        MenteeIntake.user_id == current_user.id
    ).first()
    
    if not intake:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please complete the AI intake process first to get personalized matches"
        )
    
    mentors = db.query(MentorProfile).all()
    
    if not mentors:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No mentors available at the moment"
        )
    
    matches = []
    for mentor in mentors:
        score, reasons, metadata = calculate_enhanced_match_score(intake, mentor)
        
        if score >= min_score:
            matches.append({
                "mentor_id": mentor.user_id,
                "mentor_name": mentor.full_name,
                "mentor_domains": mentor.domains or "General",
                "mentor_skills": mentor.skills or "Various",
                "mentor_experience": mentor.years_experience or 0,
                "mentor_bio": mentor.bio or "",
                "mentor_rate": mentor.hourly_rate or 0,
                "mentor_availability": mentor.availability or "Not specified",
                "is_verified": mentor.is_verified,
                "match_score": score,
                "match_reasons": reasons
            })
    
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    
    for match in matches[:limit]:
        existing_match = db.query(MentorMatch).filter(
            MentorMatch.mentee_id == current_user.id,
            MentorMatch.mentor_id == match["mentor_id"]
        ).first()
        
        if not existing_match:
            new_match = MentorMatch(
                mentee_id=current_user.id,
                mentor_id=match["mentor_id"],
                match_score=match["match_score"],
                match_reasons=match["match_reasons"],
                match_metadata={}
            )
            db.add(new_match)
    
    db.commit()
    
    return matches[:limit]


@router.delete("/intake/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_intake(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete intake data and start fresh"""
    intake = db.query(MenteeIntake).filter(
        MenteeIntake.user_id == current_user.id
    ).first()
    
    if intake:
        db.delete(intake)
        db.commit()
    
    return None