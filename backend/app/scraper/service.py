import httpx
from asyncpg import Connection
from bs4 import BeautifulSoup
from fastapi import HTTPException


async def fetch_greenhouse_jobs(company: str, limit: int = 10) -> list[dict]:
    """
    Fetches jobs for a given company from the Greenhouse public JSON API.
    """
    url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url)
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=504,
                detail=f"Connection error while fetching jobs from Greenhouse for company '{company}': {e!s}",
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch jobs from Greenhouse for company '{company}'. Error: {response.text}",
            )

        data = response.json()
        jobs = data.get("jobs", [])
        return jobs[:limit]


def _clean_html(html_content: str) -> str:
    """
    Removes HTML tags from the content to store clean text in the database.
    (Optional: could keep HTML if frontend will render it, but text is safer)
    """
    if not html_content:
        return ""
    # We use basic BeautifulSoup just for text extraction since we are only scraping an API, not HTML pages
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text(separator="\n").strip()


async def save_jobs(
    conn: Connection, user_id: str, company: str, jobs_data: list[dict]
) -> int:
    """
    Saves fetched jobs to the database using an upsert mechanism.
    Returns the number of jobs processed.
    """
    if not jobs_data:
        return 0

    # Define base source URL
    source_url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"

    # We will use execute_many or a loop for upserts
    # execute_many doesn't return the row count well, so we'll do an executemany with a prepared statement
    query = """
        INSERT INTO jobs (
            user_id, status, company, location, description, 
            job_url, application_url, greenhouse_id, source_url, title
        ) VALUES (
            $1, 'NOT_STARTED', $2, $3, $4, $5, $6, $7, $8, $9
        )
        ON CONFLICT (user_id, greenhouse_id, source_url)
        DO UPDATE SET
            updated_at = NOW(),
            title = EXCLUDED.title,
            location = EXCLUDED.location,
            description = EXCLUDED.description,
            job_url = EXCLUDED.job_url,
            application_url = EXCLUDED.application_url
    """

    # Prepare parameters
    params = []
    for job in jobs_data:
        greenhouse_id = str(job.get("id"))
        title = job.get("title", "")
        location = job.get("location", {}).get("name", "")

        # Some jobs might not have 'content' if we didn't use content=true, but we did.
        html_description = job.get("content", "")
        description = _clean_html(html_description)

        absolute_url = job.get("absolute_url", "")

        # Derive application URL by appending #app
        application_url = f"{absolute_url}#app" if absolute_url else ""

        # For job_url, we just use absolute_url
        job_url = absolute_url

        params.append(
            (
                user_id,
                company,
                location,
                description,
                job_url,
                application_url,
                greenhouse_id,
                source_url,
                title,
            )
        )

    # Perform bulk upsert
    await conn.executemany(query, params)
    return len(jobs_data)


async def get_user_jobs(
    conn: Connection,
    user_id: str,
    company: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    Retrieves jobs associated with a specific user, with pagination and optional company filter.
    """
    if company:
        count_query = "SELECT COUNT(*) FROM jobs WHERE user_id = $1 AND company = $2"
        total = await conn.fetchval(count_query, user_id, company)

        query = """
            SELECT * FROM jobs
            WHERE user_id = $1 AND company = $2
            ORDER BY scraped_at DESC
            LIMIT $3 OFFSET $4
        """
        records = await conn.fetch(query, user_id, company, limit, offset)
    else:
        count_query = "SELECT COUNT(*) FROM jobs WHERE user_id = $1"
        total = await conn.fetchval(count_query, user_id)

        query = """
            SELECT * FROM jobs
            WHERE user_id = $1
            ORDER BY scraped_at DESC
            LIMIT $2 OFFSET $3
        """
        records = await conn.fetch(query, user_id, limit, offset)

    return [dict(record) for record in records], total


async def get_scraped_companies(conn: Connection, user_id: str) -> list[str]:
    """
    Retrieves a list of distinct companies for which the user has scraped jobs.
    """
    query = """
        SELECT DISTINCT company FROM jobs
        WHERE user_id = $1
        ORDER BY company ASC
    """
    records = await conn.fetch(query, user_id)
    return [record["company"] for record in records]
