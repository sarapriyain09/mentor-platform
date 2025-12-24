from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import os
import stripe
from app.schemas.payments_schema import PaymentCreate, PaymentOut
from app.database import SessionLocal
from app.models.payments import Payment, WebhookEvent
from app.models.booking import Booking
from app.models.user import User
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["payments"])

# initialize stripe with secret from env
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Platform commission percent (e.g. 0.20 for 20%)
COMMISSION_PERCENT = float(os.getenv("PLATFORM_COMMISSION_PERCENT", "0.20"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create-checkout-session", response_model=dict)
def create_checkout_session(payload: PaymentCreate, db: Session = Depends(get_db)):
    # Validate booking exists
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Create a Payment record (pending)
    payment = Payment(
        booking_id=payload.booking_id,
        amount=payload.amount,
        currency="GBP",
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Create Stripe Checkout Session
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": "gbp",
                    "product_data": {"name": f"Booking #{booking.id} session"},
                    "unit_amount": int(payload.amount * 100),
                },
                "quantity": 1,
            }],
            metadata={"payment_id": str(payment.id), "booking_id": str(booking.id)},
            success_url=os.getenv("FRONTEND_SUCCESS_URL", "http://localhost:3000/success") + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=os.getenv("FRONTEND_CANCEL_URL", "http://localhost:3000/cancel"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}


@router.post("/create-payment-intent", response_model=dict)
def create_payment_intent(payload: PaymentCreate, db: Session = Depends(get_db)):
    # Validate booking exists
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Create a Payment record (pending)
    payment = Payment(
        booking_id=payload.booking_id,
        amount=payload.amount,
        currency="GBP",
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Create Stripe PaymentIntent for client-side confirmation
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(payload.amount * 100),
            currency="gbp",
            metadata={"payment_id": str(payment.id), "booking_id": str(booking.id)},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # store stripe intent id
    payment.stripe_payment_intent_id = intent.id
    db.add(payment)
    db.commit()

    return {"client_secret": intent.client_secret, "payment_id": payment.id, "payment_intent_id": intent.id}


@router.post("/confirm", response_model=PaymentOut)
def confirm_payment(payload: dict, db: Session = Depends(get_db)):
    """Confirm a payment using payment_id or payment_intent_id. Returns updated payment."""
    payment = None
    payment_id = payload.get("payment_id")
    payment_intent_id = payload.get("payment_intent_id")

    if payment_id:
        payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
    elif payment_intent_id:
        payment = db.query(Payment).filter(Payment.stripe_payment_intent_id == payment_intent_id).first()
    else:
        raise HTTPException(status_code=400, detail="payment_id or payment_intent_id required")

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # If already succeeded, return
    if payment.status == 'succeeded':
        return payment

    # Fetch intent from Stripe if we have an intent id
    try:
        intent = None
        if payment_intent_id:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        elif payment.stripe_payment_intent_id:
            intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)
    except Exception:
        intent = None

    # If Stripe reports succeeded, finalize locally
    if intent and intent.get('status') == 'succeeded':
        # reuse finalize logic
        payment.stripe_payment_intent_id = intent.get('id')
        payment.status = 'succeeded'
        payment.platform_fee = round(payment.amount * COMMISSION_PERCENT, 2)
        payment.mentor_payout_amount = round(payment.amount - payment.platform_fee, 2)
        payment.updated_at = datetime.utcnow()
        db.add(payment)

        # update booking
        try:
            booking = db.query(Booking).filter(Booking.id == int(payment.booking_id)).first()
            if booking:
                booking.payment_status = 'paid'
                booking.status = 'confirmed'
                booking.confirmed_at = datetime.utcnow()
                db.add(booking)

                # credit mentor
                if booking.mentor_id:
                    mentor = db.query(User).filter(User.id == int(booking.mentor_id)).first()
                    if mentor:
                        mentor.balance = (mentor.balance or 0.0) + payment.mentor_payout_amount
                        db.add(mentor)
        except Exception:
            pass

        db.commit()

    return payment


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        ) if endpoint_secret else stripe.Event.construct_from(await request.json(), stripe.api_key)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    # Idempotency: skip if we've already processed this Stripe event ID
    event_id = event.get('id') if isinstance(event, dict) else getattr(event, 'id', None)
    if event_id:
        existing = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
        if existing:
            return JSONResponse(status_code=200, content={"status": "already_processed"})
        # record this event as received before processing
        try:
            we = WebhookEvent(event_id=event_id, event_type=event.get('type') if isinstance(event, dict) else getattr(event, 'type', None))
            db.add(we)
            db.commit()
        except Exception:
            db.rollback()

    # Helper to finalize payment: compute commission and mentor payout
    def finalize_payment(payment: Payment):
        # idempotent - skip if already finalized
        if getattr(payment, "status", None) == 'succeeded':
            return
        payment.status = 'succeeded'
        payment.platform_fee = round(payment.amount * COMMISSION_PERCENT, 2)
        payment.mentor_payout_amount = round(payment.amount - payment.platform_fee, 2)
        payment.updated_at = datetime.utcnow()
        db.add(payment)
        # Credit mentor balance
        try:
            booking = db.query(Booking).filter(Booking.id == int(payment.booking_id)).first()
            if booking and booking.mentor_id:
                mentor = db.query(User).filter(User.id == int(booking.mentor_id)).first()
                if mentor:
                    mentor.balance = (mentor.balance or 0.0) + payment.mentor_payout_amount
                    db.add(mentor)
        except Exception:
            # don't raise on balance credit failure here; log could be added
            pass

    # Handle checkout.session.completed
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        metadata = session.get('metadata', {})
        payment_id = metadata.get('payment_id')
        booking_id = metadata.get('booking_id')

        # Update payment record
        if payment_id:
            payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
            if payment:
                payment.stripe_payment_intent_id = session.get('payment_intent')
                finalize_payment(payment)

        # Update booking status
        if booking_id:
            booking = db.query(Booking).filter(Booking.id == int(booking_id)).first()
            if booking:
                booking.payment_status = 'paid'
                booking.status = 'confirmed'
                booking.confirmed_at = datetime.utcnow()
                db.add(booking)

        db.commit()

    # Handle PaymentIntent succeeded (for Elements flow)
    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        metadata = intent.get('metadata', {})
        payment_id = metadata.get('payment_id')
        booking_id = metadata.get('booking_id')

        if payment_id:
            payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
            if payment:
                payment.stripe_payment_intent_id = intent.get('id')
                finalize_payment(payment)

        if booking_id:
            booking = db.query(Booking).filter(Booking.id == int(booking_id)).first()
            if booking:
                booking.payment_status = 'paid'
                booking.status = 'confirmed'
                booking.confirmed_at = datetime.utcnow()
                db.add(booking)

        db.commit()

    return JSONResponse(status_code=200, content={"status": "received"})
