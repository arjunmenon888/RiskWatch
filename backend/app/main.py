import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import models
from app.api.routes import auth, blueprints, certificates, dashboards, documents, gameplay, games, health, levels, publishing, rewards, topics
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

APP_VERSION = "1.0.0"
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RiskWatch API",
    description="AI-powered game-based learning platform",
    version=APP_VERSION,
)

cors_origins = [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19006",
    *settings.backend_cors_origins,
    settings.frontend_url,
]
cors_origins = list(
    dict.fromkeys(origin.strip().rstrip("/") for origin in cors_origins if origin.strip())
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(dashboards.router)
app.include_router(games.router)
app.include_router(documents.router)
app.include_router(blueprints.ai_router)
app.include_router(blueprints.blueprints_router)
app.include_router(levels.ai_router)
app.include_router(levels.levels_router)
app.include_router(gameplay.router)
app.include_router(certificates.router)
app.include_router(publishing.router)
app.include_router(rewards.router)
app.include_router(topics.ai_router)
app.include_router(topics.topics_router)


@app.get("/", tags=["service"])
def root() -> dict[str, str]:
    return {
        "app": "RiskWatch API",
        "status": "running",
        "environment": "production",
    }


@app.get("/api/info", tags=["service"])
def api_info() -> dict[str, str]:
    return {
        "name": "RiskWatch",
        "version": APP_VERSION,
        "status": "running",
    }


@app.on_event("startup")
def startup() -> None:
    database_connected = False

    try:
        Base.metadata.create_all(bind=engine)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_connected = True
        logger.info("Database connected successfully")
    except Exception:
        logger.exception("Database connection failed; API will continue starting")

    logger.info("Application version: %s", APP_VERSION)
    logger.info("Environment: %s", settings.environment)
    logger.info("Database connected: %s", database_connected)
    logger.info("RiskWatch API started")
