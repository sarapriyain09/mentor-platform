import argparse
from typing import Optional

from app.database import SessionLocal
from app.models.user import User
from app.models.profile import Profile
from app.models.booking import Booking
from app.models.payment import Payment


def _get_user(db, *, email: Optional[str], user_id: Optional[int]) -> Optional[User]:
    if user_id is not None:
        return db.query(User).filter(User.id == user_id).first()
    if email is not None:
        return db.query(User).filter(User.email == email).first()
    raise ValueError("Either email or user_id must be provided")


def _normalize_role(db, user: User) -> None:
    current_role = getattr(user, "role", None)
    if current_role is None:
        return
    role_str = str(current_role)
    normalized = role_str.lower()
    if normalized != role_str:
        setattr(user, "role", normalized)
        db.commit()
        db.refresh(user)


def print_user_data(*, email: Optional[str], user_id: Optional[int], normalize_role: bool) -> None:
    db = SessionLocal()
    try:
        user = _get_user(db, email=email, user_id=user_id)
        print('--- User ---')
        print(user)
        if not user:
            print("User not found")
            return

        if normalize_role:
            before = getattr(user, "role", None)
            _normalize_role(db, user)
            after = getattr(user, "role", None)
            print(f"\nNormalized role: {before!r} -> {after!r}")

        resolved_user_id = getattr(user, "id", None)
        if resolved_user_id is None:
            print("User has no id; cannot query related rows")
            return

        print('\n--- Profile ---')
        profile = db.query(Profile).filter(Profile.user_id == resolved_user_id).first()
        print(profile)

        print('\n--- Bookings (as mentee or mentor) ---')
        bookings = db.query(Booking).filter((Booking.mentee_id == resolved_user_id) | (Booking.mentor_id == resolved_user_id)).all()
        for b in bookings:
            print(b)

        print('\n--- Payments (for user bookings) ---')
        booking_ids = [b.id for b in bookings if b.id is not None]
        if booking_ids:
            payments = db.query(Payment).filter(Payment.booking_id.in_(booking_ids)).all()
            for p in payments:
                print(p)
        else:
            print('No bookings found, so no payments.')
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect a user's records (and optionally normalize role to lowercase).")
    parser.add_argument("--email", help="User email", default=None)
    parser.add_argument("--id", type=int, help="User id", default=None)
    parser.add_argument(
        "--normalize-role",
        action="store_true",
        help="Lowercase the user's role in DB (e.g., MENTEE -> mentee)",
    )
    args = parser.parse_args()
    print_user_data(email=args.email, user_id=args.id, normalize_role=args.normalize_role)


if __name__ == '__main__':
    main()
