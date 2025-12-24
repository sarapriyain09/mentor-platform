import requests
import json

url = 'http://127.0.0.1:8002/auth/register'
payload = {
    "email": "test1@example.com",
    "password": "Test1234",
    "full_name": "Test User",
    "role": "mentee"
}

print('Sending to', url)
r = requests.post(url, json=payload, timeout=10)
print('STATUS', r.status_code)
try:
    print(r.json())
except Exception:
    print(r.text)
