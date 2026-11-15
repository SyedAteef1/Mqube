"""Repeated wrong passwords are refused for a while (API may be reachable from the internet)."""
from httpx import ASGITransport, AsyncClient

from app.api.v1 import auth as auth_api
from app.main import app


async def test_login_locks_after_repeated_failures(db_session):
    auth_api._login_failures.clear()
    try:
        codes = []
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            for _ in range(auth_api.LOGIN_MAX_FAILURES + 1):
                r = await client.post("/api/v1/auth/login", json={"username": "ratelimit_probe", "password": "wrong-password-1"})
                codes.append(r.status_code)
        assert all(c in (400, 401, 403) for c in codes[:-1]), codes
        assert codes[-1] == 429, codes
        assert "Too many wrong passwords" in r.text
    finally:
        auth_api._login_failures.clear()
