import asyncio
import os

import asyncpg
import httpx
from asyncpg import Connection

from app.apply import tasks
from app.automation.engine import apply_to_job
from app.candidate.service import get_active_resume, get_profile
from app.config import settings
from app.storage.service import download_file_bytes, get_file_url, upload_file


async def get_job_by_id(conn: Connection, job_id: str, user_id: str) -> dict | None:
    query = "SELECT * FROM jobs WHERE id = $1::uuid AND user_id = $2::uuid"
    row = await conn.fetchrow(query, job_id, user_id)
    if row:
        return dict(row)
    return None


async def update_job_status(
    conn: Connection,
    job_id: str,
    status: str,
    failure_reason: str | None = None,
    screenshot_file_id: str | None = None,
):
    query = """
        UPDATE jobs
        SET status = $2, failure_reason = $3, screenshot_file_id = $4, updated_at = NOW()
        WHERE id = $1::uuid
    """
    await conn.execute(query, job_id, status, failure_reason, screenshot_file_id)


async def get_pending_jobs(conn: Connection, user_id: str) -> list[dict]:
    query = "SELECT * FROM jobs WHERE user_id = $1::uuid AND status = 'NOT_STARTED' ORDER BY scraped_at ASC"
    rows = await conn.fetch(query, user_id)
    return [dict(r) for r in rows]


async def get_jobs_by_ids(conn: Connection, job_ids: list[str], user_id: str) -> list[dict]:
    if not job_ids:
        return []
    query = "SELECT * FROM jobs WHERE user_id = $1::uuid AND id = ANY($2::uuid[]) AND status = 'NOT_STARTED'"
    rows = await conn.fetch(query, user_id, job_ids)
    return [dict(r) for r in rows]


async def download_resume_to_disk(
    resume_file_id: str, user_id: str, job_id: str, user_name: str
) -> str:
    """
    Downloads the active resume from Appwrite to the local disk.
    Path: backend/user-data/resumes/{user_id}/{job_id}/{user_name}_RESUME.pdf
    """
    url = get_file_url(resume_file_id)
    safe_name = "".join([c if c.isalnum() else "_" for c in user_name])
    if not safe_name:
        safe_name = "User"

    dir_path = os.path.join(settings.RESUME_STORAGE_DIR, str(user_id), str(job_id))
    os.makedirs(dir_path, exist_ok=True)

    file_path = os.path.join(dir_path, f"{safe_name}_RESUME.pdf")

    # Use the authenticated Appwrite SDK in a thread to download
    def _download_and_write():
        file_bytes = download_file_bytes(resume_file_id)
        with open(file_path, "wb") as f:
            f.write(file_bytes)

    await asyncio.to_thread(_download_and_write)

    return os.path.abspath(file_path)


async def process_single_job(
    conn: Connection, job: dict, user_id: str, profile: dict, resume: dict
) -> dict:
    """
    Processes a single job application.
    """
    job_id = str(job["id"])

    # 1. Mark as PROCESSING
    await update_job_status(conn, job_id, "PROCESSING")

    # 2. Download Resume
    user_name = profile.get("full_name", "User")
    resume_path = None
    try:
        resume_path = await download_resume_to_disk(
            resume["appwrite_file_id"], user_id, job_id, user_name
        )
    except Exception as e:
        await update_job_status(
            conn, job_id, "FAILED", f"Resume download failed: {e!s}"
        )
        return {
            "success": False,
            "failure_reason": f"Resume download failed: {e!s}",
            "screenshot_url": None,
        }

    # 3. Call Automation Engine
    try:
        result = await apply_to_job(
            job, profile, resume_path, headless=settings.PLAYWRIGHT_HEADLESS
        )

        screenshot_file_id = None
        screenshot_url = None

        if result["screenshot_bytes"]:
            screenshot_file_id = await upload_file(
                result["screenshot_bytes"],
                f"screenshot_{job_id}.png",
                "screenshots",
            )
            screenshot_url = f"/api/apply/screenshot/{screenshot_file_id}"

        status = "SCREENSHOT_CAPTURED" if result["success"] else "FAILED"

        await update_job_status(
            conn, job_id, status, result["failure_reason"], screenshot_file_id
        )

        return {
            "success": result["success"],
            "failure_reason": result["failure_reason"],
            "screenshot_url": screenshot_url,
        }
    except Exception as e:
        await update_job_status(
            conn, job_id, "FAILED", f"Automation execution failed: {e!s}"
        )
        return {"success": False, "failure_reason": str(e), "screenshot_url": None}


async def process_apply_all_task(task_id: str, user_id: str, jobs: list[dict]):
    """
    Background task to process multiple jobs sequentially.
    """
    try:
        # Use direct URL with statement_cache_size=0 for Neon/PgBouncer compatibility
        conn = await asyncpg.connect(
            settings.DATABASE_DIRECT_URL, statement_cache_size=0
        )

        profile = await get_profile(conn, user_id)
        resume = await get_active_resume(conn, user_id)

        if not profile or not resume:
            tasks.complete_task(task_id)
            await conn.close()
            return

        for job in jobs:
            job_id = str(job["id"])
            tasks.update_task_running(task_id, job_id)
            result = await process_single_job(conn, job, user_id, profile, resume)
            if result["success"]:
                tasks.update_task_passed(task_id, job_id)
            else:
                tasks.update_task_failed(task_id, job_id)

    except Exception as e:
        print(f"Background task {task_id} failed: {e}")
    finally:
        tasks.complete_task(task_id)
        if "conn" in locals() and not conn.is_closed():
            await conn.close()
