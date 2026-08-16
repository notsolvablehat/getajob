from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.candidate.router import router as candidate_router
from app.config import settings
from app.database import close_db_pool, init_db_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db_pool()
    yield
    # Shutdown
    await close_db_pool()


app = FastAPI(
    title="GetaJob API",
    description="Automated job application dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.APP_ENV}


app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(candidate_router, prefix="/api/candidate", tags=["Candidate"])
