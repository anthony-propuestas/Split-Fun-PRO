import requests
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import register_verify_and_login, make_session

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_postapiauthlogout():
    session = make_session()
    email = f"tc003_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassw0rd!"

    try:
        # Register, verify email via D1 query, and login
        login_resp = register_verify_and_login(session, email, password)
        login_json = login_resp.json()
        assert "success" in login_json and login_json["success"] is True

        # Ensure session cookie is set
        session_cookies = session.cookies.get_dict()
        assert session_cookies  # Check that cookies are not empty

        # Perform logout with the session cookie
        logout_resp = session.post(f"{BASE_URL}/auth/logout", timeout=TIMEOUT)
        assert logout_resp.status_code == 200
        logout_json = logout_resp.json()
        assert logout_json.get("success") is True

        # Verify session is invalidated by trying to access an authenticated endpoint
        me_resp = session.get(f"{BASE_URL}/users/me", timeout=TIMEOUT)
        assert me_resp.status_code == 401
        me_json = me_resp.json()
        assert "error" in me_json and me_json["error"] == "Unauthorized"

    finally:
        # Cleanup: there's no explicit delete user endpoint, so no cleanup beyond test isolation assumed
        pass

test_postapiauthlogout()
