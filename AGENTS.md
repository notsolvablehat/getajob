# GetaJob (Job Scraper and Automated Applier)

## Project Overview
GetaJob is an automated job application dashboard that simplifies and automates the process of finding and applying to jobs. The system fetches job listings dynamically using the Greenhouse public API, and then uses headless browser automation to automatically apply to jobs using the candidate's profile and resume.

### Tech Stack
- **Backend**: FastAPI (Python 3.11+) with `asyncpg` for database connection pooling.
- **Database**: PostgreSQL hosted on **Neon** (includes Neon Auth for user authentication and RLS).
- **Automation**: Playwright (Python) to interact with job portals sequentially.
- **Storage**: Appwrite Cloud (Single bucket for resumes and screenshots).
- **Frontend**: React/Next.js (To be built).

---

## Agent Instructions & Rules

1. **Python Formatting & Linting (CRITICAL)**
   - After *every* batch of code edits or new file creations, you MUST format the code and run the linter.
   - Run: `ruff format`
   - Run: `ruff check --fix`
   - If `ruff` reports any remaining errors that couldn't be auto-fixed, you must address and fix them immediately before moving on.

2. **Backend Architecture**
   - Use asynchronous programming (`async def`) for all routes and database calls.
   - Database operations use `asyncpg` (via raw SQL statements instead of an ORM like SQLAlchemy for maximum performance with Playwright).
   - Authentication is handled via Neon Auth; the FastAPI backend strictly verifies the JWT tokens sent by the frontend, without needing its own `users` table.
   - Files (Resumes, Screenshots) are uploaded to a single Appwrite bucket, logically separated by folder prefixes (`resumes/` and `screenshots/`).

3. **Playwright Rules**
   - Playwright should default to `headless=True` but support `headless=False` (headed mode) if configured globally in the database.
   - Apply to jobs sequentially to avoid bot-detection and keep memory usage low.

4. **Scraping Rules**
   - Do NOT use Playwright or BeautifulSoup to scrape Greenhouse. Use the public JSON API (`https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true`) via `httpx`.


---
# Phases that are to be followed to build the above
Phase 1 → Database Schema (Done)
Phase 2 → FastAPI Project Setup + Config (Done)
Phase _ → Auth (JWT + Refresh Tokens) (skipped, using Neon's Auth)
Phase 3 → Candidate Profile API
Phase 4 → Resume Upload (disk → Appwrite later)
Phase 5 → Job Scraper (httpx + Greenhouse API)
Phase 6 → Scraping API endpoint
Phase 7 → Playwright Automation Engine
Phase 8 → Apply API (single + apply-all)
Phase 9 → Screenshots (save to disk → Appwrite later)
Phase 10 → Frontend (React/Next.js)
