from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MessageCreate(BaseModel):
    recipient_id: int
    content: str


class MessageOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    other_user_id: int
    other_user_name: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
