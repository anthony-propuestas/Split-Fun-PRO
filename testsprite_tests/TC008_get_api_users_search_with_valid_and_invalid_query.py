import requests

BASE_URL = "http://localhost:5173"
REGISTER_URL = f"{BASE_URL}/api/auth/register"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
USERS_SEARCH_URL = f"{BASE_URL}/api/users/search"

TEST_EMAIL = "testuser_tc008@example.com"
TEST_PASSWORD = "StrongPassw0rd!"


def test_get_api_users_search_with_valid_and_invalid_query():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    timeout = 30

    # Register a new user for testing
    register_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    reg_resp = session.post(REGISTER_URL, json=register_payload, timeout=timeout)
    # Accept 201 for new user, 200 for zero-trust duplicate, or 400 for validation error
    assert reg_resp.status_code in (200, 201, 400), f"Unexpected status on register: {reg_resp.status_code} {reg_resp.text}"
    if reg_resp.status_code == 400:
        # If error is about user already registered, continue
        reg_json = reg_resp.json()
        allowed_errors = ["INVALID_INPUT", "INVALID_EMAIL", "WEAK_PASSWORD"]
        # If error keys are different, ignore - assume test user exists
    else:
        reg_json = reg_resp.json()
        assert reg_json.get("success") is True


    # Login to get session cookie
    login_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    login_resp = session.post(LOGIN_URL, json=login_payload, timeout=timeout)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("success") is True
    # Session cookie is stored in the session for subsequent requests automatically

    # Test with valid query (3 or more characters)
    valid_query = "abc"
    valid_resp = session.get(USERS_SEARCH_URL, params={"q": valid_query}, timeout=timeout)
    assert valid_resp.status_code == 200, f"Valid query failed: {valid_resp.status_code} {valid_resp.text}"
    valid_json = valid_resp.json()
    assert "results" in valid_json, "Results missing in valid query response"
    assert isinstance(valid_json["results"], list), "Results should be a list"

    # Test with invalid query (less than 3 characters)
    invalid_query = "ab"
    invalid_resp = session.get(USERS_SEARCH_URL, params={"q": invalid_query}, timeout=timeout)
    assert invalid_resp.status_code == 400, f"Invalid query did not fail as expected: {invalid_resp.status_code} {invalid_resp.text}"
    invalid_json = invalid_resp.json()
    assert "error" in invalid_json, "Error key missing for invalid query response"

    # Logout to clean up session cookie (optional)
    logout_url = f"{BASE_URL}/api/auth/logout"
    logout_resp = session.post(logout_url, timeout=timeout)
    # Logout might fail if session expired or so, no assertion on logout needed

test_get_api_users_search_with_valid_and_invalid_query()