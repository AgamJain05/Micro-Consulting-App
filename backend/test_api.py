import os
import requests
import time

API_URL = "http://localhost:8000/api/v1"

def test_flow():
    print("Starting automated test flow...")
    
    # 1. Register a test user
    email = f"test_{int(time.time())}@example.com"
    password = "strongpassword123"
    
    print(f"1. Registering user: {email}")
    register_payload = {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "User",
        "role": "client"
    }
    
    try:
        reg_res = requests.post(f"{API_URL}/auth/register", json=register_payload)
        if reg_res.status_code == 200:
            print("   SUCCESS: User registered")
        else:
            print(f"   FAILED: {reg_res.status_code} - {reg_res.text}")
            return
    except Exception as e:
        print(f"   ERROR: Could not connect to backend. Is it running? {e}")
        return

    # 2. Login
    print("2. Logging in...")
    login_data = {
        "username": email,
        "password": password
    }
    
    login_res = requests.post(f"{API_URL}/auth/login", data=login_data)
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        print("   SUCCESS: Login successful, token received")
    else:
        print(f"   FAILED: {login_res.status_code} - {login_res.text}")
        return

    # 3. Get Profile
    print("3. Fetching Profile...")
    headers = {"Authorization": f"Bearer {token}"}
    me_res = requests.get(f"{API_URL}/auth/me", headers=headers)
    
    if me_res.status_code == 200:
        print(f"   SUCCESS: Hello {me_res.json()['first_name']}")
    else:
        print(f"   FAILED: {me_res.status_code} - {me_res.text}")

if __name__ == "__main__":
    # Ensure requests is installed
    try:
        import requests
        test_flow()
    except ImportError:
        print("Please install 'requests' library: pip install requests")

