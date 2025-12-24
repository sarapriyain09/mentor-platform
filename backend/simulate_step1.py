from datetime import datetime, date, time
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.booking import Booking


def ensure_tables():
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

        mentor = get_or_create_user(db, 'mentor@example.com', 'mentor')
        mentee = get_or_create_user(db, 'mentee@example.com', 'mentee')

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

        result = f"Created booking id={booking.id} mentor={mentor.id} mentee={mentee.id} amount=£{booking.amount}\n"
        print(result)
        with open('backend/sim_step1_result.txt', 'w') as f:
            f.write(result)

    finally:
        db.close()


if __name__ == '__main__':
    run()
