from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.mentorship import MentorshipRequest, Mentorship
from app.models.profile import MentorProfile, MenteeProfile
from app.schemas.mentorship_schema import (
    MentorshipRequestCreate,
    MentorshipRequestOut,
    MentorshipRequestWithDetails,
    MentorshipOut,
    MentorshipWithDetails
)

router = APIRouter(
    prefix="/mentorship",
    tags=["Mentorship"]
)


# -------------------------
# Create Mentorship Request (Mentee -> Mentor)
# -------------------------
@router.post("/requests", response_model=MentorshipRequestOut)
def create_request(
    request_data: MentorshipRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only mentees can send requests
    if current_user.role != "mentee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentees can send mentorship requests"
        )
    
    # Check if mentor exists and has a profile
    mentor = db.query(User).filter(User.id == request_data.mentor_id).first()
    if not mentor or mentor.role != "mentor":
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    mentor_profile = db.query(MentorProfile).filter(
        MentorProfile.user_id == request_data.mentor_id
    ).first()
    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    
    # Check if request already exists
    existing_request = db.query(MentorshipRequest).filter(
        MentorshipRequest.mentee_id == current_user.id,
        MentorshipRequest.mentor_id == request_data.mentor_id,
        MentorshipRequest.status == "pending"
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending request to this mentor"
        )
    
    # Check if active mentorship already exists
    existing_mentorship = db.query(Mentorship).filter(
        Mentorship.mentee_id == current_user.id,
        Mentorship.mentor_id == request_data.mentor_id,
        Mentorship.status == "active"
    ).first()
    if existing_mentorship:
        raise HTTPException(
            status_code=400,
            detail="You already have an active mentorship with this mentor"
        )
    
    # Create request
    new_request = MentorshipRequest(
        mentee_id=current_user.id,
        mentor_id=request_data.mentor_id,
        message=request_data.message
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


# -------------------------
# Get My Requests (as Mentee)
# -------------------------
@router.get("/requests/sent", response_model=list[MentorshipRequestWithDetails])
def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can view sent requests")
    
    requests = db.query(MentorshipRequest).filter(
        MentorshipRequest.mentee_id == current_user.id
    ).all()
    
    # Add mentor names
    result = []
    for req in requests:
        mentor_profile = db.query(MentorProfile).filter(
            MentorProfile.user_id == req.mentor_id
        ).first()
        result.append({
            **req.__dict__,
            "mentor_name": mentor_profile.full_name if mentor_profile else "Unknown"
        })
    
    return result


# -------------------------
# Get Received Requests (as Mentor)
# -------------------------
@router.get("/requests/received", response_model=list[MentorshipRequestWithDetails])
def get_received_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can view received requests")
    
    requests = db.query(MentorshipRequest).filter(
        MentorshipRequest.mentor_id == current_user.id
    ).all()
    
    # Add mentee names
    result = []
    for req in requests:
        mentee_profile = db.query(MenteeProfile).filter(
            MenteeProfile.user_id == req.mentee_id
        ).first()
        result.append({
            **req.__dict__,
            "mentee_name": mentee_profile.name if mentee_profile else "Unknown"
        })
    
    return result


# -------------------------
# Accept Mentorship Request (Mentor)
# -------------------------
@router.put("/requests/{request_id}/accept", response_model=MentorshipOut)
def accept_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can accept requests")
    
    request = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == request_id,
        MentorshipRequest.mentor_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Update request status
    request.status = "accepted"
    
    # Create mentorship
    mentorship = Mentorship(
        mentor_id=current_user.id,
        mentee_id=request.mentee_id,
        status="active"
    )
    db.add(mentorship)
    db.commit()
    db.refresh(mentorship)
    
    return mentorship


# -------------------------
# Reject Mentorship Request (Mentor)
# -------------------------
@router.put("/requests/{request_id}/reject")
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can reject requests")
    
    request = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == request_id,
        MentorshipRequest.mentor_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    request.status = "rejected"
    db.commit()
    
    return {"message": "Request rejected"}


# -------------------------
# Get My Active Mentorships
# -------------------------
@router.get("/active", response_model=list[MentorshipWithDetails])
def get_active_mentorships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "mentor":
        mentorships = db.query(Mentorship).filter(
            Mentorship.mentor_id == current_user.id,
            Mentorship.status == "active"
        ).all()
        
        result = []
        for m in mentorships:
            mentee_profile = db.query(MenteeProfile).filter(
                MenteeProfile.user_id == m.mentee_id
            ).first()
            result.append({
                **m.__dict__,
                "mentee_name": mentee_profile.name if mentee_profile else "Unknown"
            })
        return result
    
    elif current_user.role == "mentee":
        mentorships = db.query(Mentorship).filter(
            Mentorship.mentee_id == current_user.id,
            Mentorship.status == "active"
        ).all()
        
        result = []
        for m in mentorships:
            mentor_profile = db.query(MentorProfile).filter(
                MentorProfile.user_id == m.mentor_id
            ).first()
            result.append({
                **m.__dict__,
                "mentor_name": mentor_profile.full_name if mentor_profile else "Unknown"
            })
        return result
    
    return []


# -------------------------
# End Mentorship
# -------------------------
@router.put("/mentorships/{mentorship_id}/complete")
def complete_mentorship(
    mentorship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mentorship = db.query(Mentorship).filter(
        Mentorship.id == mentorship_id
    ).filter(
        (Mentorship.mentor_id == current_user.id) | (Mentorship.mentee_id == current_user.id)
    ).first()
    
    if not mentorship:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    
    if mentorship.status != "active":
        raise HTTPException(status_code=400, detail="Mentorship is not active")
    
    mentorship.status = "completed"
    db.commit()
    
    return {"message": "Mentorship marked as completed"}
