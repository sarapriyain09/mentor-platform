from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.profile import MentorProfile, MenteeProfile
from app.schemas.profile_schema import MentorProfileCreate, MentorProfileOut, MenteeProfileCreate, MenteeProfileOut
from app.utils.auth_utils import get_current_user, get_password_hash
from app.models.user import User
from app.schemas import UserCreate, UserOut

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"]
)

# -------------------------
# Create Mentor Profile
# -------------------------
@router.post("/mentor", response_model=MentorProfileOut)
def create_mentor_profile(profile: MentorProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if db_profile:
        raise HTTPException(status_code=400, detail="Mentor profile already exists")
    new_profile = MentorProfile(user_id=current_user.id, **profile.dict())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

# -------------------------
# Create Mentee Profile
# -------------------------
@router.post("/mentee", response_model=MenteeProfileOut)
def create_mentee_profile(profile: MenteeProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_profile = db.query(MenteeProfile).filter(MenteeProfile.user_id == current_user.id).first()
    if db_profile:
        raise HTTPException(status_code=400, detail="Mentee profile already exists")
    new_profile = MenteeProfile(user_id=current_user.id, **profile.dict())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user  # ✅ THIS FIXES THE 500
