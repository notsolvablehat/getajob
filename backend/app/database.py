from collections.abc import AsyncGenerator

import asyncpg

from app.config import settings

# Global pool object
db_pool = None


async def init_db_pool():
    global db_pool
    # Neon pooling requires prepared statements to be disabled for PgBouncer compatibility if using the pooled string
    db_pool = await asyncpg.create_pool(
        dsn=settings.DATABASE_URL,
        min_size=2,
        max_size=10,
        command_timeout=60,
        server_settings={"statement_timeout": "60000"},
    )
    print("✅ Connected to Neon PostgreSQL!")


async def close_db_pool():
    global db_pool
    if db_pool:
        await db_pool.close()
        print("🛑 Closed Neon PostgreSQL connection!")


async def get_db_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Dependency injection for FastAPI routes"""
    global db_pool
    if db_pool is None:
        raise Exception("Database pool not initialized")

    async with db_pool.acquire() as connection:
        yield connection
