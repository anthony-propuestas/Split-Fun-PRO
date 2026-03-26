import requests
import uuid

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_get_api_users_me_with_and_without_session_cookie():
    # Use a unique email for registration to avoid conflicts
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "StrongPassw0rd!"

    session = requests.Session()
    try:
        # Register the user
        register_resp = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": test_email, "password": test_password},
            timeout=TIMEOUT,
        )
        assert register_resp.status_code == 201, f"Register failed: {register_resp.text}"
        register_data = register_resp.json()
        assert "success" in register_data and register_data["success"] is True
        assert "requiresEmailVerification" in register_data and register_data["requiresEmailVerification"] is True

        # Login to get session cookie
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": test_email, "password": test_password},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "success" in login_data and login_data["success"] is True

        # GET /api/users/me with session cookie (authenticated)
        user_resp = session.get(
            f"{BASE_URL}/api/users/me",
            timeout=TIMEOUT,
        )
        assert user_resp.status_code == 200, f"Authenticated /api/users/me failed: {user_resp.text}"
        user_data = user_resp.json()
        assert "id" in user_data and isinstance(user_data["id"], str)
        assert "email" in user_data and user_data["email"] == test_email

        # GET /api/users/me without session cookie (unauthenticated)
        no_session_resp = requests.get(
            f"{BASE_URL}/api/users/me",
            timeout=TIMEOUT,
        )
        assert no_session_resp.status_code == 401, f"Unauthenticated /api/users/me should be 401 but got {no_session_resp.status_code}"
        no_session_data = no_session_resp.json()
        assert "error" in no_session_data and no_session_data["error"].lower() == "unauthorized"

    finally:
        # Logout to invalidate the session (cleanup)
        try:
            logout_resp = session.post(
                f"{BASE_URL}/api/auth/logout",
                timeout=TIMEOUT,
            )
            # Logout may fail if session expired, ignore errors here
        except Exception:
            pass

test_get_api_users_me_with_and_without_session_cookie()