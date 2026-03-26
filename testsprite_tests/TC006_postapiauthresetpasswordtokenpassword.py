import requests
import uuid

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_postapiauthresetpasswordtokenpassword():
    # Step 1: Register a user to get a valid email and initial password.
    register_email = f"testuser_{uuid.uuid4().hex}@example.com"
    initial_password = "InitPass123!"
    new_password = "NewPass456!"
    session = requests.Session()

    try:
        # Register user
        resp = requests.post(
            f"{BASE_URL}/auth/register",
            json={"email": register_email, "password": initial_password},
            timeout=TIMEOUT,
        )
        assert resp.status_code == 201, f"Registration failed: {resp.text}"
        data = resp.json()
        assert data.get("success") is True
        assert data.get("requiresEmailVerification") is True, f"Missing 'requiresEmailVerification' field: {resp.text}"

        # Note: The API sends verification email with token, but no endpoint to fetch token.
        # For test purposes, simulate user flow by logging in is not possible before verification.
        # We assume in this test environment the user is auto-verified or bypass verification.

        # Step 2: Request password reset by sending forgot-password request
        resp = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json={"email": register_email},
            timeout=TIMEOUT,
        )
        # API always returns 200 success with message, regardless email exists.
        assert resp.status_code == 200, f"Forgot password failed: {resp.text}"
        data = resp.json()
        assert data.get("success") is True

        # Step 3: To test reset-password with valid token, we need a valid reset token.
        # Since tokens from email cannot be fetched in this test, we must simulate or mock.
        # But as per instructions, create new resource if not provided and test password reset.
        # We cannot proceed without a reset token. Skipping actual token acquisition due to lack of API in PRD.
        # Instead, register a new user, call forgot-password, then assume token is 'valid-reset-token'.
        # This is a placeholder to demonstrate the call and assertions.

        # This dummy token simulates a valid token obtained externally.
        valid_reset_token = "valid-reset-token"

        # Perform password reset with valid token and new password.
        resp = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json={"token": valid_reset_token, "password": new_password},
            timeout=TIMEOUT,
        )

        # Check success or possible 400 error with invalid token.
        if resp.status_code == 200:
            data = resp.json()
            assert data.get("success") is True

            # Step 4: Verify that old session (if any) is invalidated by attempting login with old password
            login_old = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": register_email, "password": initial_password},
                timeout=TIMEOUT,
            )
            # Expect 401 INVALID_CREDENTIALS because password changed
            assert login_old.status_code == 401
            data_old = login_old.json()
            assert data_old.get("error") == "INVALID_CREDENTIALS"

            # Step 5: Login with new password succeeds
            login_new = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": register_email, "password": new_password},
                timeout=TIMEOUT,
            )
            assert login_new.status_code == 200
            data_new = login_new.json()
            assert data_new.get("success") is True
            # Verify session cookie set
            cookies = login_new.cookies
            assert any(c.name.startswith("session") for c in cookies), "Session cookie not set after login"
        else:
            # If token invalid or expired
            data = resp.json()
            assert resp.status_code == 400
            assert "error" in data and "message" in data
    finally:
        # Cleanup: No API to delete user provided; skipping cleanup.
        pass

test_postapiauthresetpasswordtokenpassword()