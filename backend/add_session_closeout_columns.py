"""Migration script to add booking closeout + payout gating columns.

Adds:
- bookings: meeting_link, session_summary, session_summary_submitted_at,
  mentee_consent, mentee_consent_at, mentee_consent_note
- payments: payout_released, payout_released_at

This repo does not use Alembic migrations; run this once against an existing DB.
"""

from __future__ import annotations

import os
from sqlalchemy import create_engine, text


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Render PostgreSQL URL fix (replace postgres:// with postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)


def _is_sqlite() -> bool:
    return DATABASE_URL.startswith("sqlite:")


def _sqlite_existing_columns(conn, table_name: str) -> set[str]:
    rows = conn.execute(text(f"PRAGMA table_info({table_name});")).fetchall()
    return {str(r[1]) for r in rows}


def _pg_existing_columns(conn, table_name: str, column_names: list[str]) -> set[str]:
    result = conn.execute(
        text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = :table_name
              AND column_name = ANY(:column_names)
            """
        ),
        {"table_name": table_name, "column_names": column_names},
    )
    return {str(row[0]) for row in result}


def add_columns() -> None:
    with engine.connect() as conn:
        try:
            bookings_cols = [
                "meeting_link",
                "session_summary",
                "session_summary_submitted_at",
                "mentee_consent",
                "mentee_consent_at",
                "mentee_consent_note",
            ]
            payments_cols = ["payout_released", "payout_released_at"]

            if _is_sqlite():
                existing_bookings = _sqlite_existing_columns(conn, "bookings")
                existing_payments = _sqlite_existing_columns(conn, "payments")
            else:
                existing_bookings = _pg_existing_columns(conn, "bookings", bookings_cols)
                existing_payments = _pg_existing_columns(conn, "payments", payments_cols)

            # bookings
            if "meeting_link" not in existing_bookings:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN meeting_link VARCHAR"))
            if "session_summary" not in existing_bookings:
                # TEXT is supported in both sqlite and postgres
                conn.execute(text("ALTER TABLE bookings ADD COLUMN session_summary TEXT"))
            if "session_summary_submitted_at" not in existing_bookings:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN session_summary_submitted_at TIMESTAMP"))
            if "mentee_consent" not in existing_bookings:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN mentee_consent BOOLEAN"))
            if "mentee_consent_at" not in existing_bookings:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN mentee_consent_at TIMESTAMP"))
            if "mentee_consent_note" not in existing_bookings:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN mentee_consent_note VARCHAR"))

            # payments
            if "payout_released" not in existing_payments:
                conn.execute(text("ALTER TABLE payments ADD COLUMN payout_released BOOLEAN DEFAULT FALSE"))
            if "payout_released_at" not in existing_payments:
                conn.execute(text("ALTER TABLE payments ADD COLUMN payout_released_at TIMESTAMP"))

            conn.commit()
            print("✅ Migration completed successfully")
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            print("If you are using SQLite and the ALTER fails, delete ./test.db and restart the server.")


if __name__ == "__main__":
    add_columns()
