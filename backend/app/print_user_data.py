from app.database import SessionLocal
from app.models.user import User
from app.models.profile import Profile
from app.models.booking import Booking
from app.models.payment import Payment

USER_EMAIL = 'shivaprakhash123@gmail.com'
USER_ID = 10  # Update if needed

def print_user_data():
    db = SessionLocal()
    try:
        print('--- User ---')
        user = db.query(User).filter(User.email == USER_EMAIL).first()
        print(user)

        print('\n--- Profile ---')
        profile = db.query(Profile).filter(Profile.user_id == USER_ID).first()
        print(profile)

        print('\n--- Bookings (as mentee or mentor) ---')
        bookings = db.query(Booking).filter((Booking.mentee_id == USER_ID) | (Booking.mentor_id == USER_ID)).all()
        for b in bookings:
            print(b)

        print('\n--- Payments (for user bookings) ---')
        booking_ids = [b.id for b in bookings]
        if booking_ids:
            payments = db.query(Payment).filter(Payment.booking_id.in_(booking_ids)).all()
            for p in payments:
                print(p)
        else:
            print('No bookings found, so no payments.')
    finally:
        db.close()

if __name__ == '__main__':
    print_user_data()
