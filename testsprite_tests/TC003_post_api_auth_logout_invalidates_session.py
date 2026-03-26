import requests
import uuid

BASE_URL = "http://localhost:5173"


def test_post_api_auth_logout_invalidates_session():
    timeout = 30
    # 1. Register a new user to get a valid session cookie
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    logout_url = f"{BASE_URL}/api/auth/logout"
    users_me_url = f"{BASE_URL}/api/users/me"

    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "StrongPassw0rd!"

    # Register new user
    register_payload = {
        "email": test_email,
        "password": test_password
    }
    try:
        r = requests.post(register_url, json=register_payload, timeout=timeout)
        assert r.status_code in (200, 201), f"Unexpected status code for register: {r.status_code}"
        register_resp = r.json()
        assert register_resp.get("success") is True

        # Login the user to get session cookie
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        r = requests.post(login_url, json=login_payload, timeout=timeout)
        assert r.status_code == 200, f"Unexpected status code for login: {r.status_code}"
        login_resp = r.json()
        assert login_resp.get("success") is True

        # Extract session cookie from response
        cookies = r.cookies
        assert cookies, "No cookies set on login response"

        session_cookie = None
        for cookie in cookies:
            # We expect the session cookie to be HTTP-only, name is not specified in PRD
            # So we assume first cookie is session cookie
            session_cookie = cookie
            break
        assert session_cookie is not None, "Session cookie not found"

        # Verify session is valid by accessing authenticated endpoint
        r = requests.get(users_me_url, cookies={session_cookie.name: session_cookie.value}, timeout=timeout)
        assert r.status_code == 200, "Session cookie invalid before logout"

        # Perform logout with session cookie
        r = requests.post(logout_url, cookies={session_cookie.name: session_cookie.value}, timeout=timeout)
        assert r.status_code == 200, "Logout request failed"
        logout_resp = r.json()
        assert logout_resp.get("success") is True

        # Verify session invalidated by attempting authenticated request
        r = requests.get(users_me_url, cookies={session_cookie.name: session_cookie.value}, timeout=timeout)
        assert r.status_code == 401, "Session cookie still valid after logout, expected 401 Unauthorized"

    finally:
        # Cleanup: No explicit user delete endpoint, so no cleanup possible.
        pass


test_post_api_auth_logout_invalidates_session()