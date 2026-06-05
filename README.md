# LearnPlay

Game-based learning platform MVP that turns uploaded learning material into editable, playable learning games.

This repository currently contains Phase 0 of the build plan: project setup, web frontend foundation, FastAPI backend foundation, PostgreSQL local development, and reusable design-system components.

## Project Structure

```text
learnplay/
├── frontend/       # Expo Web / React Native Web frontend
├── backend/        # FastAPI backend
├── docs/           # Product plan and design references
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop

## Frontend

```bash
cd frontend
npm install
npm run web
```

The Expo Web app runs at the local URL printed by Expo, usually `http://localhost:8081`.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

FastAPI runs at `http://localhost:8004` when earlier dev-server ports are unavailable.

Health check:

```bash
curl http://localhost:8004/health
```

Phase 1 auth endpoints:

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me
POST /auth/role
GET  /dashboards/creator
GET  /dashboards/player
```

Phase 2 creator game draft endpoints:

```text
POST   /creator/games
GET    /creator/games
GET    /creator/games/{game_id}
PATCH  /creator/games/{game_id}
DELETE /creator/games/{game_id}
```

Phase 3 document upload endpoints:

```text
POST /api/games/{game_id}/documents/upload
GET  /api/games/{game_id}/documents
GET  /api/games/{game_id}/documents/{document_id}
```

Phase 4 topic extraction endpoints:

```text
POST   /api/ai/extract-topics
GET    /api/games/{game_id}/topics
PATCH  /api/games/{game_id}/topics/{topic_id}
POST   /api/games/{game_id}/topics/reorder
DELETE /api/games/{game_id}/topics/{topic_id}
```

Phase 5 blueprint endpoints:

```text
POST  /api/ai/create-blueprint
GET   /api/games/{game_id}/blueprint
PATCH /api/games/{game_id}/blueprint
POST  /api/games/{game_id}/blueprint/approve
```

## Database

```bash
docker compose up -d postgres
```

Default local database URL:

```text
postgresql+psycopg://learnplay:learnplay@localhost:5432/learnplay
```

## Environment

Copy the example files before running services:

```bash
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
```

## Phase Status

- Phase 0: Product setup, repository, and design system complete.
- Phase 1: Authentication and role-based access complete.
- Phase 2: Creator game draft setup complete.
- Phase 3: Document upload and processing complete.
- Phase 4: AI topic extraction complete.
- Phase 5: Game blueprint creation complete.
- Phase 6: Level-by-level AI generation not started.
