import sys
import os
sys.path.append('.')

os.environ['DATABASE_URL'] = "postgresql://postgres:Raja%40250709@localhost:5432/mentor_db"

from app.database import SessionLocal
from app.models.user import User
from app.auth import hash_password

db = SessionLocal()

try:
    test_user = User(
        email="direct_pg_test@example.com",
        full_name="Direct PG Test",
        role="MENTEE",
        password=hash_password("password123")
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    print(f"✅ User created successfully in PostgreSQL!")
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
