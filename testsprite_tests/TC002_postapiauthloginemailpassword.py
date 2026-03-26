import requests
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import register_verify_and_login, make_session

BASE_URL = "http://localhost:5173/api"
LOGIN_URL = f"{BASE_URL}/auth/login"
LOGOUT_URL = f"{BASE_URL}/auth/logout"
TIMEOUT = 30


def test_postapiauthloginemailpassword():
    test_email = f"tc002_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "Str0ngP@ssw0rd!"
    session = make_session()
    try:
        # Register, verify email via D1 query, and login
        login_resp = register_verify_and_login(session, test_email, test_password)

        login_json = login_resp.json()
        assert login_json.get("success") is True

        # Verify HTTP-only session cookie is set
        cookies = login_resp.cookies
        assert cookies, "No cookies set by login response"
        set_cookie_headers = login_resp.headers.get("Set-Cookie")
        assert set_cookie_headers is not None
        assert "HttpOnly" in set_cookie_headers and "session" in set_cookie_headers.lower()

        # Test login with invalid credentials
        bad_resp = session.post(
            LOGIN_URL,
            json={"email": test_email, "password": "wrongpassword"},
            timeout=TIMEOUT,
        )
        assert bad_resp.status_code == 401
        assert bad_resp.json().get("error") == "INVALID_CREDENTIALS"

    finally:
        try:
            session.post(LOGOUT_URL, timeout=TIMEOUT)
        except Exception:
            pass

test_postapiauthloginemailpassword()
