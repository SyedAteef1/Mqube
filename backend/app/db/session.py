import os
import re
import psycopg2
from typing import Dict, Optional, AsyncGenerator
from urllib.parse import urlparse
from fastapi import Request, Header, HTTPException, status
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine
from sqlalchemy import text
from ..core.config import settings

import sys
import os
from sqlalchemy.pool import NullPool

def _is_testing() -> bool:
    return "pytest" in sys.modules or os.getenv("TESTING") == "1"

# ---------------------------------------------------------------------------
# Control Plane Engine & Session Factory (tileflowsys)
# ---------------------------------------------------------------------------
_ctrl_engine_kwargs = {"echo": False, "pool_pre_ping": True}
if _is_testing():
    _ctrl_engine_kwargs["poolclass"] = NullPool
else:
    _ctrl_engine_kwargs.update({"pool_size": 10, "max_overflow": 20, "pool_recycle": 1800})

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    **_ctrl_engine_kwargs
)

async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# ---------------------------------------------------------------------------
# Dynamic Multi-Company Engine & Session Pool Cache
# ---------------------------------------------------------------------------
_company_engines: Dict[str, AsyncEngine] = {}
_company_sessionmakers: Dict[str, async_sessionmaker] = {}
_verified_company_databases = {"tileflowsys"}

# Seed default control plane engine into pool
_company_engines["tileflowsys"] = engine
_company_sessionmakers["tileflowsys"] = async_session


def _verify_database_is_registered(db_clean: str) -> bool:
    """
    Authoritative registry check in tileflowsys.
    Ensures an engine is created ONLY for registered databases in READY status.
    """
    if db_clean in _verified_company_databases:
        return True

    from sqlalchemy.engine import make_url
    parsed_url = make_url(settings.DATABASE_URL)  # decodes %40 etc. in the password
    user = os.getenv("POSTGRES_USER") or parsed_url.username or "postgres"
    password = os.getenv("POSTGRES_PASSWORD") or parsed_url.password or "postgres"
    db_host = os.getenv("POSTGRES_HOST") or parsed_url.host or "localhost"
    db_port = int(os.getenv("POSTGRES_PORT") or parsed_url.port or 5432)
    try:
        # Keyword arguments, so a password with @ or # needs no escaping.
        # psycopg2's default sslmode ("prefer") also works with hosted PostgreSQL.
        conn = psycopg2.connect(host=db_host, port=db_port, user=user, password=password, dbname="tileflowsys")
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM company_database_registries WHERE LOWER(database_name) = %s AND status = 'READY';",
            (db_clean,)
        )
        row = cur.fetchone()
        conn.close()
        if row:
            _verified_company_databases.add(db_clean)
            return True
    except Exception:
        pass
    return False


def get_company_async_engine(database_name: str, host: str = "localhost", port: int = 5432) -> AsyncEngine:
    """
    Retrieves or creates a cached AsyncEngine for a specific company database.
    Prevents connection pool proliferation and resource exhaustion.
    Rejects arbitrary or unregistered database names by validating against tileflowsys registry.
    """
    db_clean = str(database_name).strip().lower()
    if not db_clean:
        raise ValueError("Database name is required.")

    if db_clean in _company_engines:
        return _company_engines[db_clean]

    if db_clean != "tileflowsys":
        pattern = r"^tileflow(?!000)(?!sys)[a-z0-9]{3}$"
        if not re.match(pattern, db_clean):
            raise ValueError(f"Invalid or unauthorized company database name: '{database_name}'")
        if not _verify_database_is_registered(db_clean):
            raise ValueError(f"Database '{database_name}' is not registered or not in READY status in Control Plane.")

    # Same server, user, password and connection options (e.g. ?ssl=require for a
    # hosted PostgreSQL) as the control database; only the database name changes.
    # make_url keeps special characters in the password correctly escaped.
    from sqlalchemy.engine import make_url
    company_db_url = make_url(settings.DATABASE_URL).set(drivername="postgresql+asyncpg", database=db_clean)

    _comp_engine_kwargs = {"echo": False, "pool_pre_ping": True}
    if _is_testing():
        _comp_engine_kwargs["poolclass"] = NullPool
    else:
        _comp_engine_kwargs.update({"pool_size": 5, "max_overflow": 10, "pool_recycle": 1800})

    company_eng = create_async_engine(
        company_db_url,
        **_comp_engine_kwargs
    )

    _company_engines[db_clean] = company_eng
    _company_sessionmakers[db_clean] = async_sessionmaker(
        bind=company_eng,
        class_=AsyncSession,
        expire_on_commit=False
    )
    return company_eng


def get_company_sessionmaker(database_name: str) -> async_sessionmaker:
    """
    Retrieves the async sessionmaker factory for a target company database.
    """
    db_clean = str(database_name).strip().lower()
    if db_clean not in _company_sessionmakers:
        get_company_async_engine(db_clean)
    return _company_sessionmakers[db_clean]


async def resolve_company_database_name(company_id_or_code: Optional[str]) -> str:
    """
    Resolves the target company database name from company_id, company_code, or defaults.
    Queries company_database_registries in tileflowsys for authoritative routing.
    Fails closed if the company context is missing, unverified, unregistered, or not in READY status.
    """
    if not company_id_or_code or not str(company_id_or_code).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company context is required for database resolution."
        )

    candidate = str(company_id_or_code).strip()

    # Query authoritative registry in tileflowsys
    async with async_session() as ctrl_session:
        stmt = text("""
            SELECT database_name, status
            FROM company_database_registries
            WHERE company_id = :cid OR database_id = :cid OR company_id = :comp_code
            LIMIT 1;
        """)
        res = await ctrl_session.execute(stmt, {
            "cid": candidate,
            "comp_code": f"COMP-{candidate}" if len(candidate) == 3 and candidate.isalnum() else candidate
        })
        row = res.fetchone()
        if row:
            db_name, db_status = row
            if db_status != "READY":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Company Database for '{candidate}' is in status '{db_status}'. Access denied."
                )
            clean_db = str(db_name).strip().lower()
            pattern = r"^tileflow(?!(?:000|sys)$)[a-z0-9]{3}$|^tileflow(?!0000$)(?!sys0$)[a-z0-9]{4}$"
            if not re.match(pattern, clean_db):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid database name '{clean_db}' resolved. Violates official naming standard."
                )
            return clean_db

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Company Database registry entry for '{candidate}' not found. Access denied."
    )


# ---------------------------------------------------------------------------
# FastAPI Dependency: get_db (Control Plane Session — tileflowsys)
# ---------------------------------------------------------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an AsyncSession to the TILEFLOW Control Plane database (tileflowsys).
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# ---------------------------------------------------------------------------
# Low-Level Session Generator by Database Name
# ---------------------------------------------------------------------------
async def get_session_by_db_name(database_name: str) -> AsyncGenerator[AsyncSession, None]:
    """
    Low-level async session generator for a specified database name.
    """
    session_factory = get_company_sessionmaker(database_name)
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def verify_db_connectivity() -> bool:
    """
    Verifies connectivity to the primary TILEFLOW Control Plane database.
    """
    try:
        async with async_session() as session:
            res = await session.execute(text("SELECT 1"))
            return res.scalar() == 1
    except Exception as e:
        print(f"[SDIC Database] Connectivity check failed: {e}")
        return False
