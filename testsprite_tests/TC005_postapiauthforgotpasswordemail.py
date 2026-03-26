import requests


def test_postapiauthforgotpasswordemail():
    base_url = "http://localhost:5173/api"
    endpoint = "/auth/forgot-password"
    url = base_url + endpoint

    # Use a valid email format for the test. The server should not reveal if it exists or not.
    test_email = "user@example.com"

    headers = {
        "Content-Type": "application/json"
    }
    json_payload = {
        "email": test_email
    }

    try:
        response = requests.post(url, json=json_payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response status code and content
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(data, dict), "Response JSON is not a dictionary"
    assert "success" in data, "Response missing 'success' field"
    assert data.get("success") is True, "'success' field is not True"
    assert "message" in data, "Response missing 'message' field"
    assert isinstance(data["message"], str), "'message' field is not a string"


test_postapiauthforgotpasswordemail()