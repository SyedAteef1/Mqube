"""Company database engines keep the control DB's connection options (hosted PostgreSQL)."""
from app.db import session as s


def test_company_engine_keeps_ssl_and_escaped_password(monkeypatch):
    monkeypatch.setattr(s.settings, "DATABASE_URL", "postgresql+asyncpg://mqube:p%40ss%23word@db.example.com:6543/tileflowsys?ssl=require")
    monkeypatch.setattr(s, "_verify_database_is_registered", lambda name: True)
    s._company_engines.pop("tileflow009", None)
    eng = s.get_company_async_engine("tileflow009")
    try:
        url = eng.url
        assert url.host == "db.example.com" and url.port == 6543
        assert url.database == "tileflow009"
        assert url.password == "p@ss#word"
        assert url.query.get("ssl") == "require"
    finally:
        s._company_engines.pop("tileflow009", None)
        s._company_sessionmakers.pop("tileflow009", None)


def test_registry_check_passes_password_as_keyword(monkeypatch):
    monkeypatch.setattr(s.settings, "DATABASE_URL", "postgresql+asyncpg://mqube:p%40ss%23word@db.example.com:6543/tileflowsys?ssl=require")
    for k in ("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_HOST", "POSTGRES_PORT"):
        monkeypatch.delenv(k, raising=False)
    seen = {}

    def fake_connect(*args, **kwargs):
        seen.update(kwargs)
        raise RuntimeError("no server in tests")

    monkeypatch.setattr(s.psycopg2, "connect", fake_connect)
    assert s._verify_database_is_registered("tileflow008") is False
    assert seen == {"host": "db.example.com", "port": 6543, "user": "mqube", "password": "p@ss#word", "dbname": "tileflowsys"}
