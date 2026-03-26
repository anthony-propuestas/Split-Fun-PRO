import requests
import uuid

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_post_api_auth_verify_email_token():
    """
    Test email verification with valid token, verify success response.
    Steps:
    1. Register a new user to get a fresh verification token (simulate).
    2. Extract the verification token from the registration step or simulate.
    3. POST /api/auth/verify-email with the valid token.
    4. Assert success response {success: true}.
    5. Cleanup: No cleanup required as this is verification.
    """

    # Create unique email and password for registration
    test_email = f"testuser_{uuid.uuid4().hex}@example.com"
    test_password = "StrongPassw0rd!"

    # Step 1: Register new user (to get a token)
    register_url = f"{BASE_URL}/auth/register"
    register_payload = {
        "email": test_email,
        "password": test_password
    }
    try:
        register_resp = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
        register_resp.raise_for_status()
        register_data = register_resp.json()
        assert register_data.get("success") is True
        assert "message" in register_data
    except Exception as e:
        raise AssertionError(f"User registration failed: {e}")

    # NOTE: The verification token is normally sent by email and is not returned in API response.
    # Since test environment is localhost, assume the token can be retrieved from a test helper or mock.
    # For this test, we simulate that the token immediately is retrievable by an internal test endpoint or known pattern.
    #
    # Since no such endpoint is documented, we cannot fetch real token.
    # To fulfill the test, we simulate by re-registering and then using the token from test (assuming tokens are echo'd or stubbed).
    # Alternatively, assume token is "valid-test-token" for test environment or skip test.
    #
    # Here, we will assume a test-only endpoint /api/auth/get-latest-verification-token for this email for testing purpose:
    # This is a reasonable approach for automated testing on localhost if available.
    #
    # If not available, test cannot proceed realistically without token.
    #
    # So try to retrieve that token:
    token = None
    token_retrieval_url = f"{BASE_URL}/auth/get-latest-verification-token"
    try:
        token_resp = requests.post(token_retrieval_url, json={"email": test_email}, timeout=TIMEOUT)
        token_resp.raise_for_status()
        token_data = token_resp.json()
        token = token_data.get("token")
    except Exception:
        # If token retrieval endpoint not available, fail test
        raise AssertionError("Cannot retrieve verification token for test user. Test cannot proceed.")

    assert token and isinstance(token, str), "Verification token must be a non-empty string"

    # Step 3: Verify email with valid token
    verify_url = f"{BASE_URL}/auth/verify-email"
    verify_payload = {"token": token}
    try:
        verify_resp = requests.post(verify_url, json=verify_payload, timeout=TIMEOUT)
        verify_resp.raise_for_status()
        verify_data = verify_resp.json()
    except Exception as e:
        raise AssertionError(f"Email verification request failed: {e}")

    # Step 4: Assert success response
    assert verify_data.get("success") is True, f"Expected success true in response, got: {verify_data}"

test_post_api_auth_verify_email_token()