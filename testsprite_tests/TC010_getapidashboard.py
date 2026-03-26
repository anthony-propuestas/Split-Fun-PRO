import requests

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_get_api_dashboard():
    session = requests.Session()
    # Credentials for login - ensure these exist in the test environment
    email = "testuser@example.com"
    password = "TestPass123!"

    try:
        # Login to get session cookie
        login_resp = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("success") is True, f"Login response not successful: {login_data}"

        # Access dashboard endpoint with authenticated session
        dashboard_resp = session.get(f"{BASE_URL}/dashboard", timeout=TIMEOUT)
        assert dashboard_resp.status_code == 200, f"Dashboard request failed: {dashboard_resp.text}"

        dashboard_data = dashboard_resp.json()
        assert isinstance(dashboard_data, dict), "Dashboard response is not a JSON object"

        # Validate keys presence
        expected_keys = {"groups", "recentExpenses", "totalOwed", "totalOwing"}
        assert expected_keys.issubset(dashboard_data.keys()), f"Dashboard response missing keys: {expected_keys - dashboard_data.keys()}"

        # Validate types
        assert isinstance(dashboard_data["groups"], list), "groups is not a list"
        assert isinstance(dashboard_data["recentExpenses"], list), "recentExpenses is not a list"
        assert isinstance(dashboard_data["totalOwed"], (int,float)), "totalOwed is not a number"
        assert isinstance(dashboard_data["totalOwing"], (int,float)), "totalOwing is not a number"

    finally:
        # Logout to clean up session
        session.post(f"{BASE_URL}/auth/logout", timeout=TIMEOUT)
        session.close()

test_get_api_dashboard()