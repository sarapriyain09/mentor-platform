from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import role_required

router = APIRouter(prefix="/profiles", tags=["Profiles"])

@router.post("/mentor")
def create_mentor_profile(
    profile: schemas.MentorProfileCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required("mentor"))
):
    mp = models.MentorProfile(user_id=user["user_id"], **profile.dict())
    db.add(mp)
    db.commit()
    db.refresh(mp)
    return mp


@router.post("/mentee")
def create_mentee_profile(
    profile: schemas.MenteeProfileCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required("mentee"))
):
    mp = models.MenteeProfile(user_id=user["user_id"], **profile.dict())
    db.add(mp)
    db.commit()
    db.refresh(mp)
    return mp
