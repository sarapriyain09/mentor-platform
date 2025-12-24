from datetime import datetime, date, time
from sqlalchemy import text
from app.database import engine

OUTPUT_FILE = 'backend/sim_step1_result.txt'

def get_or_create_user_raw(conn, email, role):
    res = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
    row = res.fetchone()
    if row:
        return row[0]
    # Try inserting with common columns; attempt multiple variants
    tried = [
        ("INSERT INTO users (email, role) VALUES (:email, :role)", {"email": email, "role": role}),
        ("INSERT INTO users (email, role, balance) VALUES (:email, :role, 0.0)", {"email": email, "role": role}),
    ]
    for stmt, params in tried:
        try:
            conn.execute(text(stmt), params)
            conn.commit()
            res = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            row = res.fetchone()
            if row:
                return row[0]
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
    raise RuntimeError('Failed to create or find user')


def run():
    conn = engine.connect()
    try:
        # create minimal booking using raw SQL
        mentor_id = get_or_create_user_raw(conn, 'mentor@example.com', 'mentor')
        mentee_id = get_or_create_user_raw(conn, 'mentee@example.com', 'mentee')

        session_date = date.today().isoformat()
        start_time = '10:00:00'
        end_time = '11:00:00'
        duration_minutes = 60
        amount = 50.0
        now = datetime.utcnow().isoformat()

        insert_stmt = text(
            "INSERT INTO bookings (mentee_id, mentor_id, session_date, start_time, end_time, duration_minutes, status, amount, payment_status, created_at, updated_at)"
            " VALUES (:mentee_id, :mentor_id, :session_date, :start_time, :end_time, :duration_minutes, :status, :amount, :payment_status, :created_at, :updated_at) RETURNING id"
        )
        try:
            res = conn.execute(insert_stmt, {
                'mentee_id': mentee_id,
                'mentor_id': mentor_id,
                'session_date': session_date,
                'start_time': start_time,
                'end_time': end_time,
                'duration_minutes': duration_minutes,
                'status': 'requested',
                'amount': amount,
                'payment_status': 'pending',
                'created_at': now,
                'updated_at': now,
            })
            row = res.fetchone()
            if row:
                booking_id = row[0]
            else:
                booking_id = None
        except Exception as e:
            conn.rollback()
            raise

        result = f"Created booking id={booking_id} mentor={mentor_id} mentee={mentee_id} amount=£{amount}\n"
        print(result)
        with open(OUTPUT_FILE, 'w') as f:
            f.write(result)
    finally:
        conn.close()

if __name__ == '__main__':
    run()
