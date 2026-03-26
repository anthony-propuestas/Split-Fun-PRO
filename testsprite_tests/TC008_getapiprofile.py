import requests
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import register_verify_and_login, make_session

BASE_URL = "http://localhost:5173/api"
PROFILE_ENDPOINT = f"{BASE_URL}/profile"
LOGOUT_ENDPOINT = f"{BASE_URL}/auth/logout"

def test_get_api_profile():
    TEST_EMAIL = f"tc008_{uuid.uuid4().hex[:8]}@example.com"
    TEST_PASSWORD = "ValidPass123!"
    session = make_session()
    try:
        # Register, verify email via D1 query, and login
        register_verify_and_login(session, TEST_EMAIL, TEST_PASSWORD)

        # GET /api/profile with valid session cookie
        profile_resp = session.get(PROFILE_ENDPOINT, timeout=30)
        assert profile_resp.status_code == 200, f"GET /profile failed: {profile_resp.text}"
        profile_json = profile_resp.json()
        assert isinstance(profile_json, dict)
        assert "display_name" in profile_json
        assert "friend_code" in profile_json
        assert isinstance(profile_json["friend_code"], str)

    finally:
        try:
            session.post(LOGOUT_ENDPOINT, timeout=30)
        except Exception:
            pass

test_get_api_profile()
