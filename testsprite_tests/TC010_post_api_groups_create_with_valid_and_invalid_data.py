import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

# Credentials for authentication - adjust as needed
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def login_get_session():
    login_url = f"{BASE_URL}/api/auth/login"
    resp = requests.post(
        login_url,
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
        timeout=TIMEOUT,
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    # Extract session cookie
    cookies = resp.cookies
    return cookies


def test_post_api_groups_create_valid_and_invalid_data():
    session_cookies = login_get_session()
    headers = {"Content-Type": "application/json"}

    created_group_id = None

    # Valid group creation data
    valid_payload = {
        "name": "Test Group",
        "emoji": "🎉",
        "description": "This is a test group for automated testing."
    }

    # Create group with valid data
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/groups",
            json=valid_payload,
            cookies=session_cookies,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 200, f"Expected 200 but got {create_resp.status_code}, body: {create_resp.text}"
        group_data = create_resp.json()
        assert isinstance(group_data, dict), "Response is not a JSON object"
        # Must contain at least: id, name, emoji, description keys (based on typical group object)
        assert "id" in group_data and isinstance(group_data["id"], str)
        assert group_data.get("name") == valid_payload["name"]
        assert group_data.get("emoji") == valid_payload["emoji"]
        assert group_data.get("description") == valid_payload["description"]

        created_group_id = group_data["id"]
    finally:
        # Attempt to delete the created group if exists
        if created_group_id:
            requests.delete(
                f"{BASE_URL}/api/groups/{created_group_id}",
                cookies=session_cookies,
                timeout=TIMEOUT,
            )

    # Invalid group creation data
    invalid_payloads = [
        {},  # empty body
        {"name": 123, "emoji": "🎉", "description": "Invalid name type"},  # name wrong type
        {"name": "Name", "emoji": 123, "description": "Invalid emoji type"},  # emoji wrong type
        {"name": "Name", "emoji": "🎉"},  # missing description (assuming mandatory)
        {"name": "", "emoji": "🎉", "description": "Empty name"},  # empty name
    ]

    for invalid_payload in invalid_payloads:
        resp = requests.post(
            f"{BASE_URL}/api/groups",
            json=invalid_payload,
            cookies=session_cookies,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 400, f"Expected 400 for invalid payload {invalid_payload}, got {resp.status_code}. Body: {resp.text}"
        error_json = resp.json()
        assert "error" in error_json or "message" in error_json, "Error response missing expected keys"


test_post_api_groups_create_valid_and_invalid_data()