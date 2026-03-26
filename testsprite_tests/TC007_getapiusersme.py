import requests

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_getapiusersme():
    session = requests.Session()
    try:
        # Register a new user
        register_payload = {
            "email": "testuser_tc007@example.com",
            "password": "StrongPassw0rd!"
        }
        register_resp = session.post(
            f"{BASE_URL}/auth/register",
            json=register_payload,
            timeout=TIMEOUT
        )
        assert register_resp.status_code == 200, f"Register failed: {register_resp.text}"
        register_data = register_resp.json()
        assert register_data.get("success") is True

        # NOTE: Email verification step is skipped because we do not have actual token
        # Assuming user can login without verification in dev or test environment

        # Login the user to get session cookie
        login_payload = {
            "email": register_payload["email"],
            "password": register_payload["password"]
        }
        login_resp = session.post(
            f"{BASE_URL}/auth/login",
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("success") is True
        # Session cookie is set automatically in the session

        # Get authenticated user's basic info
        users_me_resp = session.get(
            f"{BASE_URL}/users/me",
            timeout=TIMEOUT
        )
        assert users_me_resp.status_code == 200, f"Get /users/me failed: {users_me_resp.text}"
        user_info = users_me_resp.json()
        assert "id" in user_info and isinstance(user_info["id"], str), "Missing or invalid 'id' in user info"
        assert "email" in user_info and user_info["email"] == register_payload["email"], "Email mismatch in user info"
    finally:
        # Logout to invalidate session and cleanup
        try:
            session.post(f"{BASE_URL}/auth/logout", timeout=TIMEOUT)
        except requests.RequestException:
            pass  # ignore logout errors

test_getapiusersme()