from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import Optional

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.booking import Booking
from app.models.mentorship import Mentorship
from app.models.profile import MentorProfile, MenteeProfile
from app.models.message import Message
from app.schemas.chat_schema import ConversationOut, MessageCreate, MessageOut


router = APIRouter(prefix="/chat", tags=["Chat"])


def _display_name_for_user(db: Session, user: User) -> str:
    role = (str(getattr(user, "role", "")) or "").lower()
    if role == "mentor":
        mp = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
        return (getattr(mp, "full_name", None) if mp else None) or (getattr(user, "full_name", None) or getattr(user, "email", None) or "Mentor")
    if role == "mentee":
        mp = db.query(MenteeProfile).filter(MenteeProfile.user_id == user.id).first()
        return (getattr(mp, "name", None) if mp else None) or (getattr(user, "full_name", None) or getattr(user, "email", None) or "Mentee")
    return getattr(user, "full_name", None) or getattr(user, "email", None) or "User"


def _chat_allowed(db: Session, user_id: int, other_user_id: int) -> bool:
    if user_id == other_user_id:
        return False

    mentorship_exists = db.query(Mentorship.id).filter(
        or_(
            and_(Mentorship.mentor_id == user_id, Mentorship.mentee_id == other_user_id),
            and_(Mentorship.mentor_id == other_user_id, Mentorship.mentee_id == user_id),
        )
    ).first()

    if mentorship_exists:
        return True

    booking_exists = db.query(Booking.id).filter(
        or_(
            and_(Booking.mentor_id == user_id, Booking.mentee_id == other_user_id),
            and_(Booking.mentor_id == other_user_id, Booking.mentee_id == user_id),
        )
    ).first()

    return booking_exists is not None


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List chat-eligible counterparts (active mentorships or any bookings)."""

    counterparts: set[int] = set()

    mentorships = db.query(Mentorship).filter(
        or_(Mentorship.mentor_id == current_user.id, Mentorship.mentee_id == current_user.id)
    ).all()
    for m in mentorships:
        mentor_id = int(getattr(m, "mentor_id"))
        mentee_id = int(getattr(m, "mentee_id"))
        me_id = int(getattr(current_user, "id"))
        counterparts.add(mentor_id if mentor_id != me_id else mentee_id)

    bookings = db.query(Booking).filter(
        or_(Booking.mentor_id == current_user.id, Booking.mentee_id == current_user.id)
    ).all()
    for b in bookings:
        mentor_id = int(getattr(b, "mentor_id"))
        mentee_id = int(getattr(b, "mentee_id"))
        me_id = int(getattr(current_user, "id"))
        counterparts.add(mentor_id if mentor_id != me_id else mentee_id)

    conversations: list[ConversationOut] = []
    for other_id in sorted(counterparts):
        if not _chat_allowed(db, int(getattr(current_user, "id")), int(other_id)):
            continue

        other_user = db.query(User).filter(User.id == other_id).first()
        if not other_user:
            continue

        last_msg: Optional[Message] = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == other_id),
                and_(Message.sender_id == other_id, Message.recipient_id == current_user.id),
            )
        ).order_by(desc(Message.created_at)).first()

        conversations.append(
            ConversationOut(
                other_user_id=other_id,
                other_user_name=_display_name_for_user(db, other_user),
                last_message=(getattr(last_msg, "content", None) if last_msg else None),
                last_message_at=(getattr(last_msg, "created_at", None) if last_msg else None),
            )
        )

    conversations.sort(key=lambda c: c.last_message_at or 0, reverse=True)
    return conversations


@router.get("/messages/{other_user_id}", response_model=list[MessageOut])
def list_messages(
    other_user_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _chat_allowed(db, int(getattr(current_user, "id")), int(other_user_id)):
        raise HTTPException(status_code=403, detail="Chat not allowed")

    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.recipient_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).limit(limit).all()

    return messages


@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message is empty")

    if not _chat_allowed(db, int(getattr(current_user, "id")), int(payload.recipient_id)):
        raise HTTPException(status_code=403, detail="Chat not allowed")

    recipient = db.query(User).filter(User.id == payload.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    msg = Message(
        sender_id=current_user.id,
        recipient_id=payload.recipient_id,
        content=payload.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
