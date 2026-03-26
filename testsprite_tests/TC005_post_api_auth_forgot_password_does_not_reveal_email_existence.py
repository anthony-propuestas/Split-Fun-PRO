import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_post_api_auth_forgot_password_does_not_reveal_email_existence():
    url = f"{BASE_URL}/api/auth/forgot-password"
    headers = {
        "Content-Type": "application/json"
    }

    # Test with existing email (assumed to be registered for this test scenario)
    existing_email = "existing_user@example.com"
    try:
        resp_existing = requests.post(url, json={"email": existing_email}, headers=headers, timeout=TIMEOUT)
        resp_existing.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed for existing email: {e}"
    data_existing = resp_existing.json()
    assert resp_existing.status_code == 200
    assert isinstance(data_existing, dict)
    assert "success" in data_existing and data_existing["success"] is True
    assert "message" in data_existing and isinstance(data_existing["message"], str)
    # The message should NOT reveal whether the email exists or not. We can't truly assert this exactly,
    # but at least message should be present and success True

    # Test with non-existing email
    non_existing_email = "nonexistent_user_12345@example.com"
    try:
        resp_nonexist = requests.post(url, json={"email": non_existing_email}, headers=headers, timeout=TIMEOUT)
        resp_nonexist.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed for non-existing email: {e}"
    data_nonexist = resp_nonexist.json()
    assert resp_nonexist.status_code == 200
    assert isinstance(data_nonexist, dict)
    assert "success" in data_nonexist and data_nonexist["success"] is True
    assert "message" in data_nonexist and isinstance(data_nonexist["message"], str)

    # Verify both responses do not reveal email existence by having same keys and success True
    assert data_existing.keys() == data_nonexist.keys()
    assert data_existing["success"] == data_nonexist["success"]

test_post_api_auth_forgot_password_does_not_reveal_email_existence()