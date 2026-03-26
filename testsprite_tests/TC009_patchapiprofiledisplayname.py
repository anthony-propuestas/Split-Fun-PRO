import requests
import uuid

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_patch_api_profile_display_name():
    # Use a unique email to register a new user
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    password = "StrongPassw0rd!"

    session = requests.Session()
    try:
        # Register new user
        register_resp = session.post(
            f"{BASE_URL}/auth/register",
            json={"email": unique_email, "password": password},
            timeout=TIMEOUT
        )
        assert register_resp.status_code == 200, f"Register failed: {register_resp.text}"
        register_data = register_resp.json()
        assert register_data.get("success") is True

        # Login to get session cookie
        login_resp = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": unique_email, "password": password},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("success") is True
        assert "session" in session.cookies or any(cookie.name.lower().startswith("session") for cookie in session.cookies), "Session cookie not set"

        # Update display name
        new_display_name = f"DisplayName_{uuid.uuid4().hex[:8]}"
        patch_resp = session.patch(
            f"{BASE_URL}/profile",
            json={"display_name": new_display_name},
            timeout=TIMEOUT
        )
        assert patch_resp.status_code == 200, f"Patch failed: {patch_resp.text}"
        patch_data = patch_resp.json()
        assert patch_data.get("success") is True

        # Verify update by fetching profile
        profile_resp = session.get(
            f"{BASE_URL}/profile",
            timeout=TIMEOUT
        )
        assert profile_resp.status_code == 200, f"Get profile failed: {profile_resp.text}"
        profile_data = profile_resp.json()
        assert profile_data.get("display_name") == new_display_name

    finally:
        # Logout to invalidate session
        logout_resp = session.post(
            f"{BASE_URL}/auth/logout",
            timeout=TIMEOUT
        )
        # logout may fail if session already invalidated, do not fail test
        if logout_resp.status_code == 200:
            logout_data = logout_resp.json()
            assert logout_data.get("success") is True

test_patch_api_profile_display_name()