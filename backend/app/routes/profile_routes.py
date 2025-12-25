from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.profile import MentorProfile, MenteeProfile
from app.schemas.profile_schema import MentorProfileCreate, MentorProfileOut, MenteeProfileCreate, MenteeProfileOut
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"]
)

# -------------------------
# Create Mentor Profile
# -------------------------
@router.post("/mentor", response_model=MentorProfileOut)
def create_mentor_profile(profile: MentorProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Role check
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can create mentor profiles")
    
    db_profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if db_profile:
        raise HTTPException(status_code=400, detail="Mentor profile already exists")
    
    new_profile = MentorProfile(user_id=current_user.id, **profile.model_dump())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


# -------------------------
# Update Mentor Profile
# -------------------------
@router.put("/mentor", response_model=MentorProfileOut)
def update_mentor_profile(profile: MentorProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Role check
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can update mentor profiles")
    
    db_profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found. Create one first.")
    
    # Update fields
    for key, value in profile.model_dump().items():
        setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile


# -------------------------
# Delete Mentor Profile
# -------------------------
@router.delete("/mentor")
def delete_mentor_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can delete mentor profiles")
    
    db_profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    
    db.delete(db_profile)
    db.commit()
    return {"message": "Mentor profile deleted successfully"}


# -------------------------
# Create Mentee Profile
# -------------------------
@router.post("/mentee", response_model=MenteeProfileOut)
def create_mentee_profile(profile: MenteeProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Debug logging
    print(f"DEBUG: Creating mentee profile - User ID: {current_user.id}, Email: {current_user.email}, Role: {current_user.role}")
    
    # Role check
    if current_user.role != "mentee":
        raise HTTPException(
            status_code=403, 
            detail=f"Only mentees can create mentee profiles. Current role: {current_user.role}"
        )
    
    db_profile = db.query(MenteeProfile).filter(MenteeProfile.user_id == current_user.id).first()
    if db_profile:
        raise HTTPException(status_code=400, detail="Mentee profile already exists")
    
    new_profile = MenteeProfile(user_id=current_user.id, **profile.model_dump())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


# -------------------------
# Update Mentee Profile
# -------------------------
@router.put("/mentee", response_model=MenteeProfileOut)
def update_mentee_profile(profile: MenteeProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Role check
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can update mentee profiles")
    
    db_profile = db.query(MenteeProfile).filter(MenteeProfile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Mentee profile not found. Create one first.")
    
    # Update fields
    for key, value in profile.model_dump().items():
        setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile


# -------------------------
# Delete Mentee Profile
# -------------------------
@router.delete("/mentee")
def delete_mentee_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can delete mentee profiles")
    
    db_profile = db.query(MenteeProfile).filter(MenteeProfile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Mentee profile not found")
    
    db.delete(db_profile)
    db.commit()
    return {"message": "Mentee profile deleted successfully"}

# -------------------------
# Get Current User's Profile
# -------------------------
@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get the current user's profile (mentor or mentee)"""
    if current_user.role == "mentor":
        profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
        if not profile:
            return {"type": "mentor", "profile": None, "exists": False}
        return {"type": "mentor", "profile": profile, "exists": True}
    
    elif current_user.role == "mentee":
        profile = db.query(MenteeProfile).filter(MenteeProfile.user_id == current_user.id).first()
        if not profile:
            return {"type": "mentee", "profile": None, "exists": False}
        return {"type": "mentee", "profile": profile, "exists": True}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid user role")


# -------------------------
# Get All Mentor Profiles (for search/listing)
# -------------------------
@router.get("/mentors", response_model=list[MentorProfileOut])
def list_mentors(db: Session = Depends(get_db)):
    """List all mentor profiles (public endpoint for mentee search)"""
    mentors = db.query(MentorProfile).all()
    return mentors
