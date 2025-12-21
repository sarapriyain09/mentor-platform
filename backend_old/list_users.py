# list_users.py
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

def list_all_users():
    db = next(get_db())  # get a database session
    users = db.query(User).all()  # fetch all users

    if not users:
        print("No users found in the database.")
        return

    print("Users in database:")
    for user in users:
        print(f"ID: {user.id}, Email: {user.email}, Role: {user.role}, Password Hash: {user.password}")

if __name__ == "__main__":
    list_all_users()
