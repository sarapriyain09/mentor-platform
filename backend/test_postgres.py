import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="mentor_db",
        user="postgres",
        password="Raja@250709"
    )
    print("✅ PostgreSQL connection successful!")
    
    cursor = conn.cursor()
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;")
    columns = cursor.fetchall()
    
    print("\nUsers table columns:")
    for col in columns:
        print(f"  - {col[0]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ PostgreSQL connection failed: {e}")
