import requests
import uuid

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_post_api_auth_register_email_password():
    # Generate unique email to avoid conflicts on repeated test executions
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    password = "Str0ngP@ssw0rd!"
    url = f"{BASE_URL}/auth/register"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": unique_email,
        "password": password
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(json_resp, dict), "Response JSON is not a dictionary"
    assert json_resp.get("success") is True, f"Expected success=True, got {json_resp.get('success')}"
    message = json_resp.get("message")
    assert isinstance(message, str) and len(message) > 0, "Message should be a non-empty string"

    # Optional: Check if message indicates that verification email is sent
    assert "verification" in message.lower(), "Message does not indicate verification email sent"

test_post_api_auth_register_email_password()