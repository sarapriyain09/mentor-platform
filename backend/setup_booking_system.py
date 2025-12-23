"""
Setup script for booking system tables
Run: python setup_booking_system.py
"""

from app.database import engine, Base, SessionLocal
from app.models.booking import Booking, Availability, BlockedDate
from app.models.user import User
from sqlalchemy import inspect

def setup_booking_tables():
    print("🔧 Setting up booking system tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Inspect tables
    inspector = inspect(engine)
    
    # Check bookings table
    if "bookings" in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('bookings')]
        print(f"✅ bookings: {len(columns)} columns")
        print(f"   Columns: {', '.join(columns[:10])}...")
    
    # Check availability table
    if "availability" in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('availability')]
        print(f"✅ availability: {len(columns)} columns")
    
    # Check blocked_dates table
    if "blocked_dates" in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('blocked_dates')]
        print(f"✅ blocked_dates: {len(columns)} columns")
    
    print("\n✅ Booking system tables created successfully!")
    print("\n📚 Available API endpoints:")
    print("   POST   /bookings/                    - Create booking")
    print("   GET    /bookings/my-bookings          - Get my bookings")
    print("   PATCH  /bookings/{id}/status          - Update booking status")
    print("   POST   /bookings/availability          - Create availability slot")
    print("   GET    /bookings/availability/my-slots - Get my availability")
    print("   GET    /bookings/availability/mentor/{id} - Get mentor available slots")
    print("   POST   /bookings/blocked-dates         - Block a date")
    print("   GET    /bookings/blocked-dates/my-dates - Get my blocked dates")

if __name__ == "__main__":
    setup_booking_tables()