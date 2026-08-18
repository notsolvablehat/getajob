import asyncio
import asyncpg
from app.config import settings

async def clear_data():
    print("Connecting to database...")
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        print("Executing TRUNCATE...")
        await conn.execute('''
            TRUNCATE TABLE automation_runs, jobs, resumes, candidate_profiles CASCADE;
        ''')
        print("All data cleared successfully (users retained).")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(clear_data())
