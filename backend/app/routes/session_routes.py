from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import role_required

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("/")
def book_session(
    session: schemas.SessionCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required("mentee"))
):
    mentee_profile = db.query(models.MenteeProfile).filter_by(user_id=user["user_id"]).first()

    new_session = models.Session(
        mentor_id=session.mentor_id,
        mentee_id=mentee_profile.id,
        scheduled_at=session.scheduled_at
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session
