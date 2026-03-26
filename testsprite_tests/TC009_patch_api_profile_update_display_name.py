import requests
import uuid

BASE_URL = "http://localhost:5173"
REGISTER_URL = f"{BASE_URL}/api/auth/register"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
PATCH_PROFILE_URL = f"{BASE_URL}/api/profile"
LOGOUT_URL = f"{BASE_URL}/api/auth/logout"

TIMEOUT = 30


def test_patch_api_profile_update_display_name():
    # Generate unique email to avoid conflicts
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    session = requests.Session()

    # Register user
    register_payload = {"email": unique_email, "password": password}
    try:
        r = session.post(REGISTER_URL, json=register_payload, timeout=TIMEOUT)
        assert r.status_code == 201, f"User registration failed: {r.text}"
        resp_json = r.json()
        assert resp_json.get("success") is True
        assert resp_json.get("requiresEmailVerification") is True

        # Login user
        login_payload = {"email": unique_email, "password": password}
        r = session.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"User login failed: {r.text}"
        resp_json = r.json()
        assert resp_json.get("success") is True

        # PATCH valid display_name update
        valid_display_name = "NewDisplayName"
        patch_payload = {"display_name": valid_display_name}
        r = session.patch(PATCH_PROFILE_URL, json=patch_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Valid PATCH failed: {r.text}"
        resp_json = r.json()
        assert resp_json.get("success") is True

        # PATCH invalid display_name (e.g. empty string)
        invalid_patch_payload = {"display_name": ""}
        r = session.patch(PATCH_PROFILE_URL, json=invalid_patch_payload, timeout=TIMEOUT)
        assert r.status_code == 400, f"Invalid PATCH did not return 400: {r.text}"
        error_resp = r.json()
        assert "error" in error_resp

    finally:
        # Logout to invalidate session cookie
        try:
            r = session.post(LOGOUT_URL, timeout=TIMEOUT)
            if r.status_code != 200:
                # ignore logout failure
                pass
        except Exception:
            pass


test_patch_api_profile_update_display_name()
