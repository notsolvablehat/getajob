# GetaJob

GetaJob is an automated job board scraper and application assistant designed to help candidates find, manage, and interact with job postings efficiently. The application automatically scrapes job postings from Greenhouse, aggregates them into a centralized dashboard, and provides a powerful "Apply" automation engine built with Playwright that takes screenshots of job application forms and prepares them for submission.

**IMPORTANT NOTE**: GetaJob is designed for automation *preparation* and *demonstration*. **Actual job applications are never submitted by this tool.** The automation fills out the application form and takes a screenshot of the filled-out form just before the submission step. It will deliberately halt and fail if the job is closed or no longer exists.

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, TanStack Router, TanStack Query, TailwindCSS, Lucide-React.
- **Backend**: Python, FastAPI, Asyncpg (PostgreSQL).
- **Automation**: Playwright (used for scraping Greenhouse job boards and automating the application form filling process).
- **Authentication**: JWT-based authentication via Neon Auth.
- **Database**: PostgreSQL (managed via Neon).
- **Storage**: Appwrite (used for storing candidate resumes and job application screenshots).

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **Bun** (used as the frontend package manager)
- **Python** (v3.10+ recommended)
- **PostgreSQL** database (or a Neon database instance)
- **Appwrite** account/instance for file storage
- **Neon Auth** for authentication

## Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/notsolvablehat/getajob.git
   cd getajob
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   bun install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```

3. **Backend Setup:**
   ```bash
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   playwright install  # Install Playwright browser binaries
   ```
   Create a `.env` file in the `backend` directory with your database, auth, and Appwrite credentials:
   ```env
   DATABASE_URL=postgresql://user:password@host/dbname
   NEON_AUTH_BASE_URL=https://your-neon-auth-url
   APPWRITE_API=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   APPWRITE_BUCKET_ID=your_bucket_id
   ```

## How to Start the Application

1. **Start the Backend server:**
   Ensure you are in the `backend` directory with your virtual environment activated.
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start the Frontend development server:**
   Open a new terminal, navigate to the `frontend` directory, and run:
   ```bash
   bun run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## How to Run Tests

The backend includes a `pytest` test suite to verify data parsing and task management logic.

To run the tests, ensure you are in the `backend` directory and run:
```bash
cd backend
PYTHONPATH=. uv run pytest tests/
```

## How to Run the Scraper

To scrape jobs for a specific company from Greenhouse:
1. Open the GetaJob web dashboard.
2. Click the **"Scrape Jobs"** button in the top navigation bar.
3. Enter the Greenhouse company slug (e.g., `twitch`, `discord`) and click **Start Scraping**.
4. The backend will use Playwright to scrape the latest job postings and save them to your database.

## How to Configure Candidate Data

Before you can run the application automation, you must set up your candidate profile:
1. Navigate to the **Profile** tab in the top navigation bar.
2. Fill out your candidate details (Name, Email, Phone, LinkedIn, GitHub, Location, etc.).
3. Upload your **Resume** (PDF format). This is uploaded securely to Appwrite.
4. Click **Save Profile**. The automation engine will use this exact data to fill out job applications.

## How to Run Individual Application Automation

1. Navigate to the **Dashboard**.
2. Find a job you want to apply for (ensure it is in the `NOT_STARTED` or `FAILED` state).
3. Click the **Apply** button on the job row.
4. The system will launch a Playwright instance in the background, navigate to the job's Greenhouse application page, automatically fill out the inputs based on your Candidate Profile, attach your resume from Appwrite, and take a screenshot of the filled form.

## How to Run Apply to All

1. On the **Dashboard**, click the **Apply to All** button in the navigation bar to enter Selection Mode.
2. Use the checkboxes on the left side of the job list to select up to 5 jobs.
3. Click **Automate X Jobs** in the navigation bar.
4. You will be redirected to the **Live Automation** page (`/automations`), where you can monitor the background task progress. 
5. The application will poll the status every 10 seconds, updating the jobs across four status lanes: Pending, In Progress, Passed (Screenshot Captured), and Failed.

## Where Screenshots Are Stored

When the automation successfully fills out a form, it takes a screenshot of the final page state before exiting. 
- The screenshot image file is uploaded securely to **Appwrite Storage**.
- The `screenshot_file_id` is saved in the PostgreSQL database under the specific job record.
- You can view the screenshot by clicking the image icon next to the job in the Dashboard. The frontend securely fetches the blob using your authentication token and opens it in a new tab.

## Known Limitations

- **Greenhouse Only**: The current scraping and automation logic is strictly tailored to Greenhouse job boards (`boards.greenhouse.io` / `job-boards.greenhouse.io`).
- **Data Hard-Failing**: If a job board indicates that the "Job doesn't exist" or "Posting no longer available" upon loading, the automation will instantly hard-fail.
- **Batch Limits**: The "Apply to All" background task is deliberately limited to processing 5 jobs concurrently or per batch to prevent overwhelming the server and to stay within rate limits.
- **Client-Side Filtering**: Dashboard filtering (by location, status, sort) operates purely client-side on the currently fetched page (size=10 by default) of the dataset.

---
*Disclaimer: This tool is built for educational and demonstration purposes. It does not submit real applications on your behalf.*
