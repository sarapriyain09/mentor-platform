# backend/add_password_reset_columns.py
"""
Migration script to add reset_token and reset_token_expiry columns to users table.
Run this once to update your existing database.
"""

from sqlalchemy import create_engine, text
import os

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# For Render PostgreSQL URL fix (replace postgres:// with postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def add_columns():
    with engine.connect() as conn:
        try:
            # Check if columns exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name IN ('reset_token', 'reset_token_expiry')
            """))
            existing_columns = [row[0] for row in result]
            
            # Add reset_token if it doesn't exist
            if 'reset_token' not in existing_columns:
                print("Adding reset_token column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR"))
                conn.commit()
                print("✅ Added reset_token column")
            else:
                print("⏭️  reset_token column already exists")
            
            # Add reset_token_expiry if it doesn't exist
            if 'reset_token_expiry' not in existing_columns:
                print("Adding reset_token_expiry column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP"))
                conn.commit()
                print("✅ Added reset_token_expiry column")
            else:
                print("⏭️  reset_token_expiry column already exists")
                
            print("\n✨ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Error during migration: {str(e)}")
            print("\nIf using SQLite, use this alternative:")
            print("Delete your test.db file and restart the server to recreate tables.")

if __name__ == "__main__":
    add_columns()
