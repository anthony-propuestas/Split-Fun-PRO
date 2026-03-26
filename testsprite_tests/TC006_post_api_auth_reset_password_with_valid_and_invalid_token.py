import requests
import uuid

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_post_api_auth_reset_password_with_invalid_token():
    session = requests.Session()

    # Test reset-password with invalid token
    invalid_token_payload = {"token": "invalid_or_expired_token_xyz", "password": "SomePass123!"}
    invalid_token_resp = session.post(f"{BASE_URL}/api/auth/reset-password", json=invalid_token_payload, timeout=TIMEOUT)
    assert invalid_token_resp.status_code == 400
    invalid_token_data = invalid_token_resp.json()
    assert "error" in invalid_token_data
    assert "message" in invalid_token_data

test_post_api_auth_reset_password_with_invalid_token()
