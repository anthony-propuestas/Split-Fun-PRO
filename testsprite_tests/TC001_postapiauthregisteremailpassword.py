import requests
import uuid

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30


def test_postapiauthregisteremailpassword():
    url = f"{BASE_URL}/auth/register"
    # Generate a unique email for the test to avoid conflicts
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "StrongP@ssw0rd1"  # Assume this is a valid strong password

    payload = {
        "email": test_email,
        "password": test_password
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to register user failed: {e}"

    # Check status code
    assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"

    # Validate response schema and content
    json_resp = response.json()
    assert isinstance(json_resp, dict), "Response is not a JSON object"
    assert json_resp.get("success") is True, "'success' should be True in response"
    # requiresEmailVerification must be present and True
    assert json_resp.get("requiresEmailVerification") is True, "'requiresEmailVerification' should be True in response"

# Call the test function
test_postapiauthregisteremailpassword()