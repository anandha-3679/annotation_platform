"""
core/database.py — Postgres connection via psycopg3 + Supabase Storage client.

IMPORTANT: Always use the Session Pooler URI from Supabase (not the direct host).
The direct db.<ref>.supabase.co host is IPv6-only and unreachable from Render/Railway.

Usage:
    from core.database import get_db
    with get_db() as conn:
        rows = conn.execute("SELECT ...").fetchall()
"""

from contextlib import contextmanager
from typing import AsyncGenerator
import psycopg
from psycopg.rows import dict_row
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from supabase import create_client, Client
from core.config import settings
import logging

logger = logging.getLogger(__name__)


# ── SQLAlchemy Async Engine & Session (FastAPI Users) ─────────────────────────
async_db_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
async_engine = create_async_engine(async_db_url, echo=False)
async_session_maker = async_sessionmaker(async_engine, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Yields an AsyncSession for FastAPI Users and async endpoints."""
    async with async_session_maker() as session:
        yield session


# ── Supabase Storage client ───────────────────────────────────────────────────
def get_supabase_client() -> Client:
    """
    Returns a Supabase client initialised with the service role key.
    Backend-only — the service role bypasses RLS. Never expose to frontend.
    """
    return create_client(settings.supabase_url, settings.supabase_service_key)


# Singleton client for the app lifetime
supabase: Client = get_supabase_client()


# ── Postgres connection (psycopg3) ────────────────────────────────────────────
@contextmanager
def get_db():
    """
    Context manager that yields a psycopg3 connection.
    Commits on success, rolls back on exception, always closes.

    Usage:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM projects").fetchall()
    """
    try:
        with psycopg.connect(
            settings.database_url,
            row_factory=dict_row,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5,
        ) as conn:
            yield conn
            conn.commit()
    except psycopg.OperationalError as e:
        logger.error("Database connection error: %s", e)
        raise


def check_db_connection() -> bool:
    """
    Lightweight health check — tries to connect and run SELECT 1.
    Returns True on success, False on failure.
    """
    try:
        with get_db() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error("DB health check failed: %s", e)
        return False
