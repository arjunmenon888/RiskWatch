from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LearnPlay API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://learnplay:learnplay@localhost:5432/learnplay"
    secret_key: str = "change-this-in-development"
    access_token_expire_minutes: int = 60 * 24
    local_storage_dir: str = "./storage"
    backend_cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:8081", "http://localhost:19006"]
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
