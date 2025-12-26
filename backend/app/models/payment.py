from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Payment(Base):
    """Payment transactions"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    
    # Stripe details
    payment_intent_id = Column(String, unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False)  # Total amount in GBP
    currency = Column(String, default="gbp")
    status = Column(String, nullable=False)  # succeeded, pending, failed, refunded
    
    # Commission tracking
    platform_fee = Column(Float, nullable=False)  # 10% commission
    mentor_payout = Column(Float, nullable=False)  # 90% to mentor
    commission_paid = Column(Boolean, default=False)

    # Payout gating (release after mentee consent)
    payout_released = Column(Boolean, default=False)
    payout_released_at = Column(DateTime, nullable=True)
    
    # Idempotency
    webhook_processed = Column(Boolean, default=False)
    webhook_event_id = Column(String, unique=True, nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    succeeded_at = Column(DateTime, nullable=True)
    
    # Relationships
    booking = relationship("Booking", backref="payment")


class MentorBalance(Base):
    """Mentor earnings balance"""
    __tablename__ = "mentor_balances"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Balance tracking
    total_earned = Column(Float, default=0.0)  # Total earned (90% of payments)
    available_balance = Column(Float, default=0.0)  # Available for payout
    pending_balance = Column(Float, default=0.0)  # Pending from recent bookings
    withdrawn = Column(Float, default=0.0)  # Total withdrawn
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    mentor = relationship("User", backref="mentor_balance")


class PayoutRequest(Base):
    """Mentor payout requests"""
    __tablename__ = "payout_requests"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Payout details
    stripe_payout_id = Column(String, nullable=True)
    bank_account_last4 = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    mentor = relationship("User", backref="payout_requests")
