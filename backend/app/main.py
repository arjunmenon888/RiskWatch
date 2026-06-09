from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, blueprints, certificates, dashboards, documents, gameplay, games, health, levels, publishing, rewards, topics
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app import models

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
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


@app.on_event("startup")
def create_database_tables() -> None:
    Base.metadata.create_all(bind=engine)
