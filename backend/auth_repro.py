"""
Auth reproduction script to test registration, login, and protected endpoints.
Run this to exercise the auth flow and capture any errors.
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test_register():
    """Test user registration"""
    print_section("Step 1: Register New User")
    
    # Use timestamp to ensure unique email
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    user_data = {
        "email": f"testuser_{timestamp}@example.com",
        "password": "TestPassword123!",
        "full_name": "Test User",
        "role": "MENTEE"
    }
    
    print(f"POST {BASE_URL}/auth/register")
    print(f"Payload: {json.dumps(user_data, indent=2)}")
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print("✅ Registration successful")
            return user_data
        else:
            print(f"Response Text: {response.text[:500]}")  # Show first 500 chars
            try:
                print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
            except:
                pass
            print(f"❌ Registration failed")
            return None
    except Exception as e:
        print(f"❌ Exception during registration: {e}")
        return None

def test_login(user_data):
    """Test user login"""
    print_section("Step 2: Login")
    
    if not user_data:
        print("⚠️ Skipping login - no user data from registration")
        return None
    
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    print(f"POST {BASE_URL}/auth/login")
    print(f"JSON Data: {json.dumps(login_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data  # Send as JSON, not form data
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"✅ Login successful - Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Exception during login: {e}")
        return None

def test_protected_endpoint(token):
    """Test accessing a protected endpoint"""
    print_section("Step 3: Access Protected Endpoint")
    
    if not token:
        print("⚠️ Skipping protected endpoint test - no token from login")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"GET {BASE_URL}/auth/users")
    print(f"Headers: Authorization: Bearer {token[:20]}...")
    
    try:
        response = requests.get(f"{BASE_URL}/auth/users", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Protected endpoint access successful")
        else:
            print(f"❌ Protected endpoint access failed: {response.json()}")
    except Exception as e:
        print(f"❌ Exception accessing protected endpoint: {e}")

def main():
    print("\n" + "="*60)
    print("  AUTH REPRODUCTION SCRIPT")
    print(f"  Backend: {BASE_URL}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Step 1: Register
    user_data = test_register()
    
    # Step 2: Login
    token = test_login(user_data)
    
    # Step 3: Protected endpoint
    test_protected_endpoint(token)
    
    print_section("Summary")
    print("Auth flow test complete. Review the output above for any errors.")
    print("Common issues to check:")
    print("  - 422 errors: Check Pydantic schema matches request payload")
    print("  - 500 errors: Check database models and SECRET_KEY env variable")
    print("  - 401 errors: Check JWT token generation and validation")

if __name__ == "__main__":
    main()
