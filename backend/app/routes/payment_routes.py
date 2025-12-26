from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.payment import Payment, MentorBalance
from app.auth import get_current_user
from typing import Optional
import stripe
import os
from datetime import datetime

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
PLATFORM_COMMISSION_RATE = 0.10  # 10% platform fee

router = APIRouter(prefix="/payments", tags=["payments"])


def calculate_commission(amount: float) -> tuple:
    """Calculate platform fee and mentor payout"""
    platform_fee = round(amount * PLATFORM_COMMISSION_RATE, 2)
    mentor_payout = round(amount - platform_fee, 2)
    return platform_fee, mentor_payout


@router.post("/create-checkout-session")
async def create_checkout_session(
    booking_id: int,
    success_url: str,
    cancel_url: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe checkout session for booking payment"""
    
    # Verify booking exists and belongs to current user (mentee)
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.mentee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this booking")

    if (booking.status or "").lower() != "confirmed":
        raise HTTPException(status_code=400, detail="Booking must be confirmed by the mentor before payment")
    
    if (booking.payment_status or "").lower() in {"paid", "completed"}:
        raise HTTPException(status_code=400, detail="Booking already paid")
    
    # Check if payment intent already exists
    existing_payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if existing_payment and existing_payment.status == "succeeded":
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "gbp",
                    "product_data": {
                        "name": f"Mentoring Session - {booking.duration_minutes} minutes",
                        "description": f"Session with mentor on {booking.session_date}",
                    },
                    "unit_amount": int(booking.amount * 100),  # Convert to pence
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": booking_id,
                "mentee_id": current_user.id,
                "mentor_id": booking.mentor_id,
            },
        )
        
        # Store payment intent ID in booking
        booking.payment_intent_id = checkout_session.payment_intent
        db.commit()
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "payment_intent_id": checkout_session.payment_intent
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events with idempotency"""
    
    # Get raw body
    payload = await request.body()
    
    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle payment_intent.succeeded event
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        event_id = event["id"]
        
        # Idempotency check: check if this webhook event was already processed
        existing_payment = db.query(Payment).filter(
            Payment.webhook_event_id == event_id
        ).first()
        
        if existing_payment:
            # Event already processed, return success
            return {"status": "already_processed", "event_id": event_id}
        
        # Also check by payment_intent_id for duplicate prevention
        existing_by_intent = db.query(Payment).filter(
            Payment.payment_intent_id == payment_intent["id"]
        ).first()
        
        if existing_by_intent and existing_by_intent.webhook_processed:
            # Payment already processed with different event ID
            return {"status": "payment_already_processed", "payment_id": existing_by_intent.id}
        
        # Get booking from metadata
        booking_id = payment_intent.get("metadata", {}).get("booking_id")
        if not booking_id:
            # Fallback: find booking by payment_intent_id
            booking = db.query(Booking).filter(
                Booking.payment_intent_id == payment_intent["id"]
            ).first()
        else:
            booking = db.query(Booking).filter(Booking.id == int(booking_id)).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found for payment")
        
        # Calculate commission
        amount = payment_intent["amount"] / 100  # Convert from pence to GBP
        platform_fee, mentor_payout = calculate_commission(amount)
        
        # Create or update payment record
        if existing_by_intent:
            payment = existing_by_intent
            payment.status = "succeeded"
            payment.webhook_processed = True
            payment.webhook_event_id = event_id
            payment.succeeded_at = datetime.utcnow()
        else:
            payment = Payment(
                booking_id=booking.id,
                payment_intent_id=payment_intent["id"],
                amount=amount,
                currency=payment_intent["currency"],
                status="succeeded",
                platform_fee=platform_fee,
                mentor_payout=mentor_payout,
                commission_paid=False,
                webhook_processed=True,
                webhook_event_id=event_id,
                succeeded_at=datetime.utcnow()
            )
            db.add(payment)
        
        # Update booking payment status (mentee has paid)
        booking.payment_status = "paid"
        
        # Update mentor balance
        mentor_balance = db.query(MentorBalance).filter(
            MentorBalance.mentor_id == booking.mentor_id
        ).first()
        
        # Hold mentor payout until session summary is approved by mentee.
        if not mentor_balance:
            mentor_balance = MentorBalance(
                mentor_id=booking.mentor_id,
                total_earned=mentor_payout,
                available_balance=0.0,
                pending_balance=mentor_payout,
            )
            db.add(mentor_balance)
        else:
            mentor_balance.total_earned += mentor_payout
            mentor_balance.pending_balance += mentor_payout
            mentor_balance.updated_at = datetime.utcnow()
        
        # Mark commission as paid
        payment.commission_paid = True
        
        db.commit()
        
        return {
            "status": "success",
            "payment_id": payment.id,
            "mentor_payout": mentor_payout,
            "platform_fee": platform_fee,
            "event_id": event_id
        }
    
    # Handle other event types
    return {"status": "event_received", "type": event["type"]}


@router.get("/balance")
async def get_mentor_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get mentor's current balance"""
    
    if current_user.role.lower() != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can view balance")
    
    balance = db.query(MentorBalance).filter(
        MentorBalance.mentor_id == current_user.id
    ).first()
    
    if not balance:
        # Create initial balance
        balance = MentorBalance(mentor_id=current_user.id)
        db.add(balance)
        db.commit()
        db.refresh(balance)
    
    return {
        "mentor_id": balance.mentor_id,
        "total_earned": balance.total_earned,
        "available_balance": balance.available_balance,
        "pending_balance": balance.pending_balance,
        "withdrawn": balance.withdrawn
    }


@router.get("/history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment history for current user"""
    
    if current_user.role.lower() == "mentor":
        # Get payments for mentor's bookings
        payments = db.query(Payment).join(Booking).filter(
            Booking.mentor_id == current_user.id
        ).order_by(Payment.created_at.desc()).all()
    else:
        # Get payments for mentee's bookings
        payments = db.query(Payment).join(Booking).filter(
            Booking.mentee_id == current_user.id
        ).order_by(Payment.created_at.desc()).all()
    
    return [{
        "id": p.id,
        "booking_id": p.booking_id,
        "amount": p.amount,
        "currency": p.currency,
        "status": p.status,
        "platform_fee": p.platform_fee if current_user.role == "MENTOR" else None,
        "mentor_payout": p.mentor_payout if current_user.role == "MENTOR" else None,
        "created_at": p.created_at.isoformat(),
        "succeeded_at": p.succeeded_at.isoformat() if p.succeeded_at else None
    } for p in payments]


@router.get("/my-payments")
async def get_my_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments for the current user (mentee's payments or mentor's earnings)"""
    print(f"DEBUG /my-payments - User ID: {current_user.id}, Email: {getattr(current_user, 'email', None)}, Role: {current_user.role}")
    if current_user.role.lower() == "mentee":
        # Get payments made by this mentee
        payments = db.query(Payment).join(Booking).filter(
            Booking.mentee_id == current_user.id
        ).order_by(Payment.created_at.desc()).all()
        return [{
            "id": p.id,
            "booking_id": p.booking_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
            "succeeded_at": p.succeeded_at.isoformat() if p.succeeded_at else None
        } for p in payments]
    elif current_user.role.lower() == "mentor":
        # Get payments received by this mentor
        payments = db.query(Payment).join(Booking).filter(
            Booking.mentor_id == current_user.id
        ).order_by(Payment.created_at.desc()).all()
        return [{
            "id": p.id,
            "booking_id": p.booking_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "platform_fee": p.platform_fee,
            "mentor_payout": p.mentor_payout,
            "created_at": p.created_at.isoformat(),
            "succeeded_at": p.succeeded_at.isoformat() if p.succeeded_at else None
        } for p in payments]
    else:
        print(f"DEBUG /my-payments - Invalid role: {current_user.role}")
        raise HTTPException(status_code=400, detail="Invalid user role")


@router.get("/test-commission")
async def test_commission_calculation(amount: float):
    """Test endpoint to verify commission calculation"""
    platform_fee, mentor_payout = calculate_commission(amount)
    return {
        "total_amount": amount,
        "platform_fee": platform_fee,
        "platform_fee_percentage": f"{PLATFORM_COMMISSION_RATE * 100}%",
        "mentor_payout": mentor_payout,
        "mentor_payout_percentage": f"{(1 - PLATFORM_COMMISSION_RATE) * 100}%"
    }
