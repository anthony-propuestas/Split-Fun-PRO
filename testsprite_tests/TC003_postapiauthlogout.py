import requests
import uuid

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_post_api_auth_logout():
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    password = "StrongPassw0rd!"

    session = requests.Session()

    try:
        register_resp = session.post(
            f"{BASE_URL}/auth/register",
            json={"email": unique_email, "password": password},
            timeout=TIMEOUT
        )
        assert register_resp.status_code == 200
        register_json = register_resp.json()
        assert register_json.get("success") is True

        login_resp = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": unique_email, "password": password},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200
        login_json = login_resp.json()
        assert login_json.get("success") is True

        assert any(cookie.name.lower() == "session" for cookie in session.cookies), "Session cookie not set after login"

        logout_resp = session.post(
            f"{BASE_URL}/auth/logout",
            timeout=TIMEOUT
        )
        assert logout_resp.status_code == 200
        logout_json = logout_resp.json()
        assert logout_json.get("success") is True

        me_resp = session.get(f"{BASE_URL}/users/me", timeout=TIMEOUT)
        assert me_resp.status_code == 401
        me_json = me_resp.json()
        assert "error" in me_json and me_json["error"] == "Unauthorized"

    finally:
        session.close()


test_post_api_auth_logout()