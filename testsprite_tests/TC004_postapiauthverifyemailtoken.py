import requests
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import get_latest_verification_token

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_postapiauthverifyemailtoken():
    register_url = f"{BASE_URL}/auth/register"
    verify_url = f"{BASE_URL}/auth/verify-email"

    test_email = f"tc004_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "StrongPassw0rd!"

    try:
        # Register new user (201 for new, 200 zero-trust for existing)
        reg_resp = requests.post(register_url, json={"email": test_email, "password": test_password}, timeout=TIMEOUT)
        assert reg_resp.status_code in (200, 201), f"Registration failed: {reg_resp.text}"
        assert reg_resp.json().get("success") is True

        if reg_resp.status_code == 201:
            # Get real token from local D1 and verify
            token = get_latest_verification_token()
            verify_resp = requests.post(verify_url, json={"token": token}, timeout=TIMEOUT)
            assert verify_resp.status_code == 200, f"Email verification failed: {verify_resp.text}"
            assert verify_resp.json().get("success") is True

        # Test with an invalid token — should return 400
        bad_resp = requests.post(verify_url, json={"token": "invalid-token-xyz"}, timeout=TIMEOUT)
        assert bad_resp.status_code == 400, f"Expected 400 for invalid token, got {bad_resp.status_code}"
        assert bad_resp.json().get("error") in ("INVALID_OR_EXPIRED", "INVALID_TOKEN")

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_postapiauthverifyemailtoken()
