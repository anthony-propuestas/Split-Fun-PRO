import requests
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import register_verify_and_login, make_session

BASE_URL = "http://localhost:5173/api"
DASHBOARD_URL = f"{BASE_URL}/dashboard"
LOGOUT_URL = f"{BASE_URL}/auth/logout"
TIMEOUT = 30

def test_getapidashboard():
    email = f"tc010_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassw0rd!"
    session = make_session()

    try:
        # Register, verify email via D1 query, and login
        register_verify_and_login(session, email, password)

        # Cookies should be set by login request
        assert session.cookies, "Session cookie not set after login"

        # Request dashboard with valid session cookie
        resp = session.get(DASHBOARD_URL, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Dashboard request failed: {resp.text}"
        data = resp.json()

        # Validate response keys (API returns groups, totalOwed, totalOwe)
        assert "groups" in data, "Missing 'groups' in dashboard response"
        assert isinstance(data["groups"], list), "'groups' should be a list"

        assert "totalOwed" in data, "Missing 'totalOwed' in dashboard response"
        assert isinstance(data["totalOwed"], (int, float)), "'totalOwed' should be a number"

        assert "totalOwe" in data, "Missing 'totalOwe' in dashboard response"
        assert isinstance(data["totalOwe"], (int, float)), "'totalOwe' should be a number"

    finally:
        # Logout user to cleanup session
        try:
            session.post(LOGOUT_URL, timeout=TIMEOUT)
        except Exception:
            pass

test_getapidashboard()