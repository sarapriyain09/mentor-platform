from app.database import engine
import sqlalchemy

def ensure_full_name():
    conn = engine.connect()
    try:
        res = conn.execute(sqlalchemy.text("PRAGMA table_info('users')"))
        cols = [row[1] for row in res.fetchall()]
        if 'full_name' not in cols:
            print('Adding full_name column to users table')
            conn.execute(sqlalchemy.text('ALTER TABLE users ADD COLUMN full_name TEXT'))
        else:
            print('full_name column already present')
    finally:
        conn.close()

if __name__ == '__main__':
    ensure_full_name()
