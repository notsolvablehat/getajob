import uuid
from datetime import datetime

from pydantic import BaseModel


class ScrapeResponse(BaseModel):
    message: str
    company: str
    jobs_scraped: int


class JobResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    scraped_at: datetime
    updated_at: datetime
    company: str
    location: str
    description: str
    job_url: str
    application_url: str
    failure_reason: str | None = None
    screenshot_file_id: str | None = None
    greenhouse_id: str
    source_url: str
    title: str

    class Config:
        from_attributes = True


class PaginatedJobsResponse(BaseModel):
    items: list[JobResponse]
    total: int
    page: int
    size: int
    pages: int
