import requests
import time

BASE = 'http://127.0.0.1:8001'

def register(email):
    url = f"{BASE}/auth/register"
    payload = {"email": email, "password": "Test1234", "role": "mentee"}
    r = requests.post(url, json=payload, timeout=10)
    print('REGISTER', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return r

def login(email):
    url = f"{BASE}/auth/login"
    payload = {"email": email, "password": "Test1234"}
    r = requests.post(url, json=payload, timeout=10)
    print('LOGIN', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return r

def list_users(token=None):
    url = f"{BASE}/auth/users"
    headers = {}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    r = requests.get(url, headers=headers, timeout=10)
    print('USERS', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return r

if __name__ == '__main__':
    ts = int(time.time())
    email = f'tester+auth{ts}@local'
    print('Using email', email)
    r1 = register(email)
    if r1.status_code not in (200,201):
        print('Register failed; aborting')
        raise SystemExit(1)
    r2 = login(email)
    if r2.status_code != 200:
        print('Login failed; aborting')
        raise SystemExit(1)
    token = r2.json().get('access_token')
    if not token:
        print('No token returned; aborting')
        raise SystemExit(1)
    list_users(token)
    print('Done')
