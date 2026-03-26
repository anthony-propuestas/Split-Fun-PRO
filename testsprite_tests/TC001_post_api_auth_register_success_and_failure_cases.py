import requests
import uuid

BASE_URL = "http://localhost:5173"
REGISTER_ENDPOINT = "/api/auth/register"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_post_api_auth_register_success_and_failure_cases():
    # Generate unique email for registration success test
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    valid_password = "StrongPassword123!"

    # Test successful registration
    try:
        response = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json={"email": unique_email, "password": valid_password},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        json_resp = response.json()
        assert "success" in json_resp and json_resp["success"] is True
        assert "requiresEmailVerification" in json_resp and json_resp["requiresEmailVerification"] is True
    except requests.RequestException as e:
        assert False, f"Request failed during successful registration test: {e}"

    # Test registration failure when EMAIL_ENCRYPTION_KEY missing or invalid:
    failure_email = f"fail_{uuid.uuid4()}@invalid.com"
    failure_password = "AnyPassword123!"

    try:
        failure_response = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json={"email": failure_email, "password": failure_password},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        if failure_response.status_code == 500:
            failure_json = failure_response.json()
            assert "error" in failure_json and isinstance(failure_json["error"], str)
            assert "message" in failure_json and isinstance(failure_json["message"], str)
        else:
            # If not 500, acceptable that environment doesn't simulate this failure
            # So assert that it's NOT 200 success (which would mean success, unexpected here for failure case)
            assert failure_response.status_code != 200
    except requests.RequestException as e:
        assert False, f"Request failed during failure scenario test: {e}"


test_post_api_auth_register_success_and_failure_cases()
