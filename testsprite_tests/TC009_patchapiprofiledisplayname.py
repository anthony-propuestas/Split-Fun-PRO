import requests
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import register_verify_and_login, make_session

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30


def test_patch_api_profile_display_name():
    session = make_session()
    new_display_name = "NewDisplayName123"

    register_email = f"tc009_{uuid.uuid4().hex[:8]}@example.com"
    register_password = "StrongPassw0rd!"
    try:
        # Register, verify email via D1 query, and login
        register_verify_and_login(session, register_email, register_password)

        # Update the authenticated user's display name
        patch_payload = {"display_name": new_display_name}
        r = session.patch(f"{BASE_URL}/profile", json=patch_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Profile update failed: {r.text}"
        json_resp = r.json()
        assert json_resp.get("success") is True

        # Retrieve profile to verify update
        r = session.get(f"{BASE_URL}/profile", timeout=TIMEOUT)
        assert r.status_code == 200, f"Profile fetch failed: {r.text}"
        json_resp = r.json()
        assert json_resp.get("display_name") == new_display_name
        assert "friend_code" in json_resp
        assert isinstance(json_resp["friend_code"], str)

    finally:
        # Logout and cleanup - no direct delete user endpoint is described
        try:
            session.post(f"{BASE_URL}/auth/logout", timeout=TIMEOUT)
        except Exception:
            pass


test_patch_api_profile_display_name()
