from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Payment(Base):
    """Records a payment attempt/transaction for a booking."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    amount = Column(Float, nullable=False)  # Total charged amount (GBP)
    currency = Column(String, default="GBP")
    stripe_payment_intent_id = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, succeeded, failed, refunded
    platform_fee = Column(Float, default=0.0)  # Commission taken by platform
    mentor_payout_amount = Column(Float, default=0.0)  # Amount mentor will receive

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = relationship("Booking", backref="payments")


class Payout(Base):
    """Scheduled or processed payouts to mentors (for future Stripe Connect)."""
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, processed, failed
    stripe_payout_id = Column(String, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    processed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    mentor = relationship("User", backref="payouts")


class WebhookEvent(Base):
    """Records Stripe webhook event ids to ensure idempotent processing."""
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, nullable=False)
    event_type = Column(String, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
