import requests

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_get_api_profile():
    session = requests.Session()
    # Use a test user credential for login - these should be replaced with valid test credentials
    test_email = "testuser@example.com"
    test_password = "TestPassword123!"

    try:
        # Step 1: Login to get session cookie
        login_resp = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": test_email, "password": test_password},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_json = login_resp.json()
        assert login_json.get("success") is True, f"Login response missing success: {login_resp.text}"

        # Step 2: Request /api/profile with session cookie
        profile_resp = session.get(
            f"{BASE_URL}/profile",
            timeout=TIMEOUT
        )
        assert profile_resp.status_code == 200, f"Profile retrieval failed: {profile_resp.text}"
        profile_json = profile_resp.json()

        # Validate required fields
        assert "display_name" in profile_json, "display_name not in profile response"
        assert isinstance(profile_json["display_name"], str), "display_name is not a string"
        assert len(profile_json["display_name"]) > 0, "display_name is empty"

        assert "friend_code" in profile_json, "friend_code not in profile response"
        assert isinstance(profile_json["friend_code"], str), "friend_code is not a string"
        assert len(profile_json["friend_code"]) > 0, "friend_code is empty"

    finally:
        # Logout to clean session cookie
        try:
            logout_resp = session.post(
                f"{BASE_URL}/auth/logout",
                timeout=TIMEOUT
            )
            assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"
            logout_json = logout_resp.json()
            assert logout_json.get("success") is True, f"Logout response missing success: {logout_resp.text}"
        except Exception:
            # Ignore logout failures
            pass


test_get_api_profile()