from math import ceil

from asyncpg import Connection
from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.database import get_db_connection
from app.scraper import service
from app.scraper.schemas import PaginatedJobsResponse, ScrapeResponse

router = APIRouter()


@router.post("/scrape/{company}", response_model=ScrapeResponse)
async def scrape_jobs(
    company: str,
    limit: int = 10,
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    """
    Triggers fetching jobs from Greenhouse for a given company and saves them into the database.
    """
    # 1. Fetch from Greenhouse API
    jobs_data = await service.fetch_greenhouse_jobs(company, limit=limit)

    # 2. Save jobs to PostgreSQL using upsert
    processed_count = await service.save_jobs(conn, user_id, company, jobs_data)

    return ScrapeResponse(
        message=f"Successfully processed {processed_count} jobs for {company}.",
        company=company,
        jobs_scraped=processed_count,
    )


@router.get("/jobs", response_model=PaginatedJobsResponse)
async def list_jobs(
    company: str | None = None,
    page: int = 1,
    size: int = 10,
    sort_by: str = "updated_at_desc",
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    """
    Returns a paginated list of all jobs scraped by the current user.
    Optionally filter by company.
    """
    limit = size
    offset = (page - 1) * size
    jobs, total = await service.get_user_jobs(conn, user_id, company, limit, offset, sort_by)
    pages = ceil(total / size) if size > 0 else 0
    return PaginatedJobsResponse(
        items=jobs, total=total, page=page, size=size, pages=pages
    )


@router.get("/companies", response_model=list[str])
async def list_companies(
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
):
    """
    Returns a list of all distinct companies for which the user has scraped jobs.
    """
    companies = await service.get_scraped_companies(conn, user_id)
    return companies
