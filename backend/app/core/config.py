from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RiskWatch API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://riskwatch:riskwatch@localhost:5432/riskwatch"
    secret_key: str = "change-this-in-development"
    access_token_expire_minutes: int = 60 * 24
    google_client_id: str = ""
    frontend_url: str = "http://localhost:8081"
    password_reset_expire_minutes: int = 30
    email_delivery_enabled: bool = False
    local_storage_dir: str = "./storage"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.4-mini"
    openai_reasoning_effort: str = "low"
    openai_timeout_seconds: float = 90
    openai_allow_local_fallback: bool = True
    backend_cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:8081", "http://localhost:19006"]
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
