import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_post_api_auth_login_with_valid_and_invalid_credentials():
    session = requests.Session()

    # First, register a new user to have valid credentials for login test
    register_url = f"{BASE_URL}/api/auth/register"
    test_email = "testuser_login_valid@example.com"
    test_password = "StrongPass!12345"

    register_payload = {
        "email": test_email,
        "password": test_password
    }

    # Register user, ignore if already exists (for robustness)
    try:
        reg_resp = session.post(register_url, json=register_payload, timeout=TIMEOUT)
        # Accept 201 for new user; ignore if already exists
        assert reg_resp.status_code in (200, 201, 400)
    except Exception as e:
        raise AssertionError(f"User registration request failed: {e}")

    login_url = f"{BASE_URL}/api/auth/login"

    # Test login with valid credentials
    valid_login_payload = {
        "email": test_email,
        "password": test_password
    }
    try:
        resp_valid = session.post(login_url, json=valid_login_payload, timeout=TIMEOUT)
    except Exception as e:
        raise AssertionError(f"Login request with valid credentials failed: {e}")

    assert resp_valid.status_code == 200, f"Expected 200 OK for valid login, got {resp_valid.status_code}"
    json_valid = resp_valid.json()
    assert "success" in json_valid and json_valid["success"] is True, "Login response missing or invalid success flag for valid credentials"
    
    # Check for session cookie set with HTTP-only attribute
    cookies = resp_valid.cookies
    assert cookies, "No cookies received in response for valid login"
    # We verify HTTP-only flag from Set-Cookie header since requests.Response.cookies does not expose HTTPOnly flag
    set_cookie_headers = resp_valid.headers.get("Set-Cookie")
    assert set_cookie_headers, "No Set-Cookie header found for valid login"
    http_only_lower = set_cookie_headers.lower()
    assert "httponly" in http_only_lower, "Session cookie is not HTTP-only"

    # Test login with invalid credentials (wrong password)
    invalid_login_payload = {
        "email": test_email,
        "password": "WrongPassword123!"
    }
    try:
        resp_invalid = session.post(login_url, json=invalid_login_payload, timeout=TIMEOUT)
    except Exception as e:
        raise AssertionError(f"Login request with invalid credentials failed: {e}")

    assert resp_invalid.status_code == 401, f"Expected 401 Unauthorized for invalid login, got {resp_invalid.status_code}"
    json_invalid = resp_invalid.json()
    assert "error" in json_invalid and json_invalid["error"] == "INVALID_CREDENTIALS", "Invalid credentials error not returned as expected"
    assert "message" in json_invalid and isinstance(json_invalid["message"], str), "Error message missing or invalid for invalid login"

test_post_api_auth_login_with_valid_and_invalid_credentials()