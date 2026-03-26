"""
Test helpers for Split Fun PRO.
Provides a register → verify (via local D1) → login flow for tests that need an authenticated session.
"""
import http.cookiejar
import json
import os
import subprocess

import requests

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "http://localhost:5173/api"
TIMEOUT = 30


class _AllowSecureOnHttp(http.cookiejar.DefaultCookiePolicy):
    """Send Secure cookies over plain HTTP — needed for localhost testing."""
    def return_ok_secure(self, cookie, request):
        return True


def make_session():
    """Return a requests.Session that forwards Secure cookies over HTTP (localhost)."""
    session = requests.Session()
    session.cookies = requests.cookies.RequestsCookieJar(policy=_AllowSecureOnHttp())
    return session


def get_latest_verification_token():
    """
    Query the local Cloudflare D1 database for the most recently created,
    unused email verification token.
    Requires the Vite dev server to be running (which also starts the local D1 worker).
    """
    result = subprocess.run(
        (
            'npx wrangler d1 execute Split-fun-pro --local '
            '--command "SELECT token FROM email_verification_tokens WHERE used_at IS NULL ORDER BY created_at DESC LIMIT 1" '
            '--json'
        ),
        capture_output=True,
        text=True,
        cwd=PROJECT_ROOT,
        shell=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"wrangler D1 query failed (exit {result.returncode}):\n{result.stderr}"
        )
    data = json.loads(result.stdout)
    rows = data[0]["results"]
    if not rows:
        raise RuntimeError(
            "No unused verification token found in D1. "
            "Make sure the dev server is running and registration succeeded."
        )
    return rows[0]["token"]


def register_verify_and_login(session, email, password):
    """
    Full auth setup:
      1. POST /api/auth/register  (expects 201 for new user, 200 zero-trust for existing)
      2. Query local D1 for the real verification token (only when a new user is registered)
      3. POST /api/auth/verify-email with the real token
      4. POST /api/auth/login
    Returns the login response.
    """
    # 1. Register
    reg_resp = session.post(
        f"{BASE_URL}/auth/register",
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    assert reg_resp.status_code in (200, 201), f"Registration failed: {reg_resp.text}"
    assert reg_resp.json().get("success") is True

    # 2 & 3. Verify email when a new account was just created (201).
    # All tests use UUID emails so registration always returns 201.
    if reg_resp.status_code == 201:
        token = get_latest_verification_token()
        verify_resp = session.post(
            f"{BASE_URL}/auth/verify-email",
            json={"token": token},
            timeout=TIMEOUT,
        )
        assert verify_resp.status_code == 200, f"Email verification failed: {verify_resp.text}"
        assert verify_resp.json().get("success") is True

    # 4. Login
    login_resp = session.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    assert login_resp.json().get("success") is True

    # The server sets the session cookie with Secure=True, which Python's requests
    # won't forward over plain HTTP (localhost). Re-insert it via dict update (no domain
    # restriction) so subsequent requests in the same session include the cookie.
    sf = login_resp.cookies.get("sf_session")
    if sf:
        session.cookies.update({"sf_session": sf})

    return login_resp
