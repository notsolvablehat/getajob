import asyncio
import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()


async def run():
    conn = await asyncpg.connect(os.environ["DATABASE_DIRECT_URL"])
    cols = await conn.fetch(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'jobs'"
    )
    print("JOBS TABLE:")
    print([(c["column_name"], c["data_type"]) for c in cols])

    tables = await conn.fetch(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    print("ALL TABLES:", [t["table_name"] for t in tables])

    enums = await conn.fetch(
        "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'job_status'"
    )
    print("JOB_STATUS ENUMS:", [e["enumlabel"] for e in enums])

    constraints = await conn.fetch(
        "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'jobs'"
    )
    print("CONSTRAINTS:", [dict(c) for c in constraints])

    await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
