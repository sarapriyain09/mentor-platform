from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.note import Note

router = APIRouter(
    prefix="/demo",
    tags=["Demo"]
)


@router.get("/notes")
def get_notes(db: Session = Depends(get_db)):
    notes = db.query(Note).all()
    return [{"id": n.id, "title": n.title, "content": n.content} for n in notes]
