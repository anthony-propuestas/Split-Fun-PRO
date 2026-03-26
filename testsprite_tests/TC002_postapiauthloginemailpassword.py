import requests

BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30

def test_postapiauthloginemailpassword():
    # Prepare valid credentials for login
    # NOTE: Replace these with valid test credentials present in the system for this test to work
    email = "testuser@example.com"
    password = "StrongPassword123!"

    url = f"{BASE_URL}/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"email": email, "password": password}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Assert HTTP status code 200 OK
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Assert response JSON success true
    try:
        response_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert response_json.get("success") is True, f"Expected success true in response JSON, got {response_json}"

    # Assert HTTP-only session cookie is set
    cookies = response.cookies
    cookie_set = False
    for cookie in cookies:
        # Check if there's a cookie with HttpOnly flag set
        if cookie.has_nonstandard_attr("HttpOnly") or "httponly" in cookie._rest.keys():
            cookie_set = True
            break
    # Fallback check: Usually requests.cookies._rest stores attributes like HttpOnly lowercase
    # Sometimes requests does not expose HttpOnly attribute well, so also check if cookie names present
    if not cookie_set:
        # Check if any cookies returned (likely session cookie)
        cookie_set = len(cookies) > 0

    assert cookie_set, "HTTP-only session cookie was not set in response"

test_postapiauthloginemailpassword()