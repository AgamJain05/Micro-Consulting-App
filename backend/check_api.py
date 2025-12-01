import requests

try:
    print("Checking API endpoint for consultants...")
    res = requests.get("http://localhost:8000/api/v1/users/consultants")
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text[:500]}...") # Print first 500 chars
except Exception as e:
    print(f"Error: {e}")

