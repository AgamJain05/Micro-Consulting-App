import requests
import json

API_URL = "http://localhost:8000/api/v1"

def debug_issue():
    print("1. Logging in to get token...")
    login_data = {
        "username": "test_client@example.com",
        "password": "password"
    }
    try:
        login_res = requests.post(f"{API_URL}/auth/login", data=login_data)
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Login successful.")
    except Exception as e:
        print(f"   Error connecting: {e}")
        return

    print("\n2. Fetching consultants to check ID field...")
    try:
        cons_res = requests.get(f"{API_URL}/users/consultants", headers=headers)
        if cons_res.status_code == 200:
            consultants = cons_res.json()
            if len(consultants) > 0:
                print(f"   Found {len(consultants)} consultants.")
                first = consultants[0]
                print(f"   First consultant keys: {list(first.keys())}")
                print(f"   ID field present? 'id' in keys: {'id' in first}")
                print(f"   _id field present? '_id' in keys: {'_id' in first}")
                
                consultant_id = first.get("id") or first.get("_id")
                print(f"   Using Consultant ID: {consultant_id}")
                
                if not consultant_id:
                    print("   CRITICAL: No ID found for consultant!")
                    return

                print("\n3. Attempting to create session (Replicating 422 error)...")
                payload = {
                    "consultant_id": consultant_id,
                    "topic": "Chat Session",
                    "duration_minutes": 15
                }
                print(f"   Payload: {json.dumps(payload)}")
                
                sess_res = requests.post(f"{API_URL}/sessions/", json=payload, headers=headers)
                print(f"   Status Code: {sess_res.status_code}")
                print(f"   Response Body: {sess_res.text}")
                
            else:
                print("   No consultants found.")
        else:
            print(f"   Failed to fetch consultants: {cons_res.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    debug_issue()

