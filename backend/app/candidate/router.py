from asyncpg import Connection
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth.dependencies import get_current_user
from app.candidate import service
from app.candidate.schemas import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
    ResumeResponse,
)
from app.database import get_db_connection
from app.storage.service import get_file_url, upload_file

router = APIRouter()


@router.get("/profile", response_model=CandidateProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    profile = await service.get_profile(conn, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile", response_model=CandidateProfileResponse)
async def update_profile(
    profile_data: CandidateProfileUpdate,
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    profile = await service.upsert_profile(conn, user_id, profile_data)
    return profile


@router.post("/resume", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    file_bytes = await file.read()
    try:
        appwrite_file_id = await upload_file(
            file_bytes, file.filename, folder_prefix="resumes"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to upload to Appwrite: {e!s}"
        )

    resume = await service.save_resume_record(
        conn, user_id, file.filename, appwrite_file_id
    )

    resume_dict = dict(resume)
    resume_dict["download_url"] = get_file_url(appwrite_file_id)

    return resume_dict


@router.get("/resume", response_model=ResumeResponse)
async def get_resume(
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    resume = await service.get_active_resume(conn, user_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Active resume not found")

    resume_dict = dict(resume)
    resume_dict["download_url"] = get_file_url(resume_dict["appwrite_file_id"])
    return resume_dict
