import requests

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_post_api_auth_forgot_password_email():
    url = f"{BASE_URL}/auth/forgot-password"
    headers = {
        "Content-Type": "application/json"
    }
    # Use a valid email format; since response does not confirm existence,
    # can use a test email
    payload = {
        "email": "testuser@example.com"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "success" in resp_json, "Missing 'success' in response"
    assert resp_json["success"] is True, "'success' field is not True"
    assert "message" in resp_json, "Missing 'message' in response"
    assert isinstance(resp_json["message"], str), "'message' is not a string"

test_post_api_auth_forgot_password_email()