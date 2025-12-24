import sqlite3

conn = sqlite3.connect('test.db')
cursor = conn.cursor()

cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
result = cursor.fetchone()

if result:
    print("Users table schema:")
    print(result[0])
else:
    print("Users table does not exist")

conn.close()
