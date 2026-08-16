import asyncio

import asyncpg


async def main():
    try:
        conn = await asyncpg.connect(
            "postgresql://neondb_owner:npg_p5F9OtsIwuSj@ep-falling-night-b3dgys5y.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
        )
        tables = await conn.fetch(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        )
        print("Tables:", [t["table_name"] for t in tables])
        for t in tables:
            cols = await conn.fetch(
                f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t['table_name']}'"
            )
            print(f"Table {t['table_name']}:")
            for c in cols:
                print(f"  {c['column_name']} ({c['data_type']})")
        await conn.close()
    except Exception as e:
        print("Error:", e)


if __name__ == "__main__":
    asyncio.run(main())
