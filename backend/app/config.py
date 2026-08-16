from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    DATABASE_DIRECT_URL: str
    # Auth
    NEON_AUTH_BASE_URL: str = ""

    # Appwrite
    APPWRITE_PROJECT_ID: str
    APPWRITE_API: str
    APPWRITE_API_KEY: str
    APPWRITE_BUCKET_ID: str

    # Application
    APP_ENV: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
