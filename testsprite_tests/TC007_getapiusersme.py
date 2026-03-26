import requests
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import register_verify_and_login, make_session

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_get_api_users_me():
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "StrongPassword123!"

    session = make_session()
    try:
        # Register, verify email via D1 query, and login
        register_verify_and_login(session, test_email, test_password)

        # GET /api/users/me with session cookie
        user_resp = session.get(f"{BASE_URL}/users/me", timeout=TIMEOUT)
        assert user_resp.status_code == 200, f"GET /users/me failed: {user_resp.text}"
        user_data = user_resp.json()
        assert isinstance(user_data, dict)
        assert "id" in user_data and isinstance(user_data["id"], str) and user_data["id"]
        assert user_data.get("email") == test_email
    finally:
        # Logout to invalidate session cookie (optional cleanup)
        session.post(f"{BASE_URL}/auth/logout", timeout=TIMEOUT)
        session.close()

test_get_api_users_me()
