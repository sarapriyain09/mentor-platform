"""
Direct database test to isolate the issue
"""
import sys
sys.path.append('.')

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.auth import hash_password

# Create tables
Base.metadata.create_all(bind=engine)

# Test creating a user directly
db = SessionLocal()

try:
    # Try creating a user
    test_user = User(
        email="direct_test@example.com",
        full_name="Direct Test",
        role="MENTEE",
        password=hash_password("password123")
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    print(f"✅ User created successfully!")
    print(f"ID: {test_user.id}")
    print(f"Email: {test_user.email}")
    print(f"Full Name: {test_user.full_name}")
    print(f"Role: {test_user.role}")
    
except Exception as e:
    print(f"❌ Error creating user: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
