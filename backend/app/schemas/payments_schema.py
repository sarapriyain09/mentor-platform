from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PaymentCreate(BaseModel):
    booking_id: int
    amount: float


class PaymentOut(BaseModel):
    id: int
    booking_id: int
    amount: float
    currency: str
    status: str
    platform_fee: float
    mentor_payout_amount: float
    stripe_payment_intent_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PayoutCreate(BaseModel):
    mentor_id: int
    amount: float


class PayoutOut(BaseModel):
    id: int
    mentor_id: int
    amount: float
    status: str
    scheduled_at: Optional[datetime]
    processed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
