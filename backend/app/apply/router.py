import uuid
from uuid import UUID

import asyncio
from asyncpg import Connection
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response

from app.apply import service, tasks
from app.apply.schemas import (
    ApplyAllStartResponse,
    ApplyAllStatusResponse,
    ApplyMultipleRequest,
    ApplyResult,
)
from app.auth.dependencies import get_current_user
from app.candidate.service import get_active_resume, get_profile
from app.database import get_db_connection
from app.storage.service import download_file_bytes

router = APIRouter()


# NOTE: Static routes MUST come before parameterized /{job_id} to avoid route conflicts.


@router.post("/all/start", response_model=ApplyAllStartResponse)
async def apply_to_all_jobs(
    request: ApplyMultipleRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    profile = await get_profile(conn, user_id)
    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Candidate profile not found. Please complete your profile first.",
        )

    resume = await get_active_resume(conn, user_id)
    if not resume:
        raise HTTPException(
            status_code=400, detail="No active resume found. Please upload a resume."
        )

    jobs = await service.get_jobs_by_ids(
        conn, [str(jid) for jid in request.job_ids], user_id
    )
    if not jobs:
        raise HTTPException(status_code=400, detail="No pending jobs found for the provided IDs.")

    task_id = str(uuid.uuid4())
    tasks.create_task(task_id, [str(j["id"]) for j in jobs])

    background_tasks.add_task(service.process_apply_all_task, task_id, user_id, jobs)

    return ApplyAllStartResponse(
        task_id=task_id,
        message=f"Started applying to {len(jobs)} jobs in the background.",
    )


@router.get("/status/{task_id}", response_model=ApplyAllStatusResponse)
async def get_apply_all_status(task_id: str, user_id: str = Depends(get_current_user)):
    status = tasks.get_task_status(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="Task not found")
    return status


@router.get("/screenshot/{file_id}")
async def get_screenshot(file_id: str, user_id: str = Depends(get_current_user)):
    """
    Proxy endpoint to securely fetch private screenshots from Appwrite.
    """
    try:
        def _download():
            return download_file_bytes(file_id)
        
        file_bytes = await asyncio.to_thread(_download)
        return Response(content=file_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Screenshot not found: {e!s}")


@router.post("/{job_id}", response_model=ApplyResult)
async def apply_to_single_job(
    job_id: UUID,  # FastAPI validates UUID format; returns 422 automatically for invalid IDs
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    job = await service.get_job_by_id(conn, str(job_id), user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile = await get_profile(conn, user_id)
    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Candidate profile not found. Please complete your profile first.",
        )

    resume = await get_active_resume(conn, user_id)
    if not resume:
        raise HTTPException(
            status_code=400, detail="No active resume found. Please upload a resume."
        )

    result = await service.process_single_job(conn, job, user_id, profile, resume)

    return ApplyResult(
        job_id=job["id"],
        status="SCREENSHOT_CAPTURED" if result["success"] else "FAILED",
        failure_reason=result["failure_reason"],
        screenshot_url=result["screenshot_url"],
    )
