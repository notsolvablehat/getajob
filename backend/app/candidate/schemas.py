from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CandidateProfileUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    location: str | None = None
    bio: str | None = None
    years_experience: int | None = None
    skills: list[str] | None = None


class CandidateProfileResponse(CandidateProfileUpdate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class ResumeResponse(BaseModel):
    id: UUID
    filename: str
    appwrite_file_id: str
    is_active: bool
    uploaded_at: datetime
    download_url: str | None = None
