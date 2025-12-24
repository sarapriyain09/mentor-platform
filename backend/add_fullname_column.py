import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="mentor_db",
        user="postgres",
        password="Raja@250709"
    )
    
    cursor = conn.cursor()
    
    # Add full_name column to users table
    print("Adding full_name column to users table...")
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;")
    
    conn.commit()
    print("✅ Column added successfully!")
    
    # Verify
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;")
    columns = cursor.fetchall()
    
    print("\nUpdated users table columns:")
    for col in columns:
        print(f"  - {col[0]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
