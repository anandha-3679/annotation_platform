"""
alembic/env.py — Alembic migration environment.

Reads DATABASE_URL from .env, imports all SQLAlchemy models so Alembic
can diff them against the live DB and auto-generate migrations.

Run migrations:
    .venv\\Scripts\\alembic upgrade head

Generate a new migration after changing models/tables.py:
    .venv\\Scripts\\alembic revision --autogenerate -m "describe your change"
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context
import os
import sys

# ── Make sure backend/ is on the path so we can import core/models ────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()  # load DATABASE_URL from .env

from models.tables import Base  # imports all ORM models

# ── Alembic Config ────────────────────────────────────────────────────────────
config = context.config

# Set the DB URL from environment (never hardcoded)
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL not set in .env — cannot run migrations")

# Supabase Session Pooler uses port 5432 (transaction mode) or 6543 (session mode).
# For Alembic (DDL migrations) we need session mode — ensure port 5432 is used.
# Ensure psycopg 3 driver is used for SQLAlchemy
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))


# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tell Alembic what models to compare against (enables --autogenerate)
target_metadata = Base.metadata


# ── Offline mode (generate SQL script without connecting) ─────────────────────
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Include public schema only (Supabase also has auth, storage, etc.)
        include_schemas=True,
        version_table_schema="public",
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode (connect and migrate directly) ────────────────────────────────
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # no pooling for migrations
    )

    with connectable.connect() as connection:
        # Enable pgcrypto for gen_random_uuid()
        connection.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
        connection.commit()

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
            version_table_schema="public",
            # Only track tables in the 'public' schema
            include_object=lambda obj, name, type_, reflected, compare_to: (
                getattr(obj, "schema", None) == "public" or type_ != "table"
            ),
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
