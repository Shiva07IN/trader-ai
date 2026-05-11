"""
Alembic Environment — async SQLAlchemy support
"""
import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Load app models so metadata is populated
from app.core.database import Base
from app.models import user, stock, portfolio, watchlist, audit  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    return os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://traderai:traderai_secret@localhost:5432/traderai_db",
    )


def run_migrations_offline():
    url = get_url()
    context.configure(
        url=url.replace("+asyncpg", ""),  # Use sync URL for offline
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    engine = create_async_engine(get_url())
    async with engine.begin() as conn:
        await conn.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
