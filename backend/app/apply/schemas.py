from uuid import UUID

from pydantic import BaseModel


class ApplyResult(BaseModel):
    job_id: UUID
    status: str
    failure_reason: str | None
    screenshot_url: str | None


class ApplyMultipleRequest(BaseModel):
    job_ids: list[UUID]


class ApplyAllStartResponse(BaseModel):
    task_id: str
    message: str


class ApplyAllStatusResponse(BaseModel):
    task_id: str
    total_jobs: int
    pending: list[str]
    ongoing: list[str]
    passed: list[str]
    failed: list[str]
    is_complete: bool
