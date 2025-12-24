from datetime import datetime, date, time
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.booking import Booking
from app.models.payments import Payment


def ensure_tables():
    # create tables if they do not exist
    Base.metadata.create_all(bind=engine)


def get_or_create_user(db, email, role):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, role=role, password='test', balance=0.0)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def run():
    db = SessionLocal()
    try:
        ensure_tables()

        # 1) Ensure mentor and mentee exist
        mentor = get_or_create_user(db, 'mentor@example.com', 'mentor')
        mentee = get_or_create_user(db, 'mentee@example.com', 'mentee')

        # 1) Mentee books session (create booking)
        booking = Booking(
            mentee_id=mentee.id,
            mentor_id=mentor.id,
            session_date=date.today(),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            status='requested',
            amount=50.0,
            payment_status='pending',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        print(f"Created booking id={booking.id} mentor={mentor.id} mentee={mentee.id} amount=£{booking.amount}")

        # 2) Pays via Stripe (simulate by creating Payment record)
        payment = Payment(
            booking_id=booking.id,
            amount=booking.amount,
            currency='GBP',
            status='pending',
            platform_fee=0.0,
            mentor_payout_amount=0.0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        print(f"Created payment id={payment.id} status={payment.status}")

        # 3) Booking confirmed — simulate webhook/payment success
        # compute commission (20%) and credit mentor
        COMMISSION_PERCENT = 0.20
        payment.status = 'succeeded'
        payment.platform_fee = round(payment.amount * COMMISSION_PERCENT, 2)
        payment.mentor_payout_amount = round(payment.amount - payment.platform_fee, 2)
        payment.updated_at = datetime.utcnow()
        db.add(payment)

        booking.payment_status = 'paid'
        booking.status = 'confirmed'
        booking.confirmed_at = datetime.utcnow()
        db.add(booking)

        mentor.balance = (mentor.balance or 0.0) + payment.mentor_payout_amount
        db.add(mentor)

        db.commit()

        print(f"Payment succeeded. platform_fee=£{payment.platform_fee} mentor_payout=£{payment.mentor_payout_amount}")
        print(f"Mentor (id={mentor.id}) new balance: £{mentor.balance}")

    finally:
        db.close()


if __name__ == '__main__':
    run()
