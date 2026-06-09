# RiskWatch

Game-based learning platform MVP that turns uploaded learning material into editable, playable learning games.

## Google Authentication Setup

RiskWatch uses Google Identity Services as its primary login.

1. Open Google Cloud Console and create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth 2.0 Client ID with application type **Web application**.
4. Add `http://localhost:8081` to **Authorized JavaScript origins**.
5. Put the client ID in both environment files:

```env
# backend/.env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# frontend/.env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

The frontend sends the Google ID token to `POST /auth/google`. The backend verifies
the token with Google's verification library before creating or updating the user.
Frontend profile data is never trusted directly.

Password-reset endpoints are available at `POST /auth/forgot-password` and
`POST /auth/reset-password`. In development, reset links are written to the backend
console when email delivery is disabled.

Apply database migrations from `backend/`:

```powershell
.\.venv\Scripts\python -m alembic upgrade head
```

This repository currently contains Phases 0-11 of the build plan, from the project foundation through versioned game publishing.

## Project Structure

```text
riskwatch/
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

Phase 6 level generation endpoints:

```text
POST /api/ai/generate-next-level
GET  /api/games/{game_id}/levels
POST /api/games/{game_id}/levels/{level_id}/approve
```

Phase 7 level editor endpoints:

```text
PATCH  /api/games/{game_id}/levels/{level_id}
POST   /api/games/{game_id}/levels/{level_id}/clone
POST   /api/games/{game_id}/levels/{level_id}/lock
POST   /api/games/{game_id}/levels/{level_id}/regenerate
DELETE /api/games/{game_id}/levels/{level_id}
```

Phase 8 reward endpoints:

```text
GET  /api/player/rewards
POST /api/player/levels/{level_id}/complete
```

Phase 9 branching endpoints:

```text
PATCH /api/games/{game_id}/levels/{level_id}
POST  /api/player/levels/{level_id}/next
```

Phase 10 gameplay endpoints:

```text
GET  /api/player/games
POST /api/player/games/{game_id}/start
GET  /api/player/games/{game_id}/progress
POST /api/player/levels/{level_id}/attempts
POST /api/player/attempts/{attempt_id}/answers
POST /api/player/attempts/{attempt_id}/complete
```

Phase 11 publishing endpoints:

```text
GET  /api/games/{game_id}/publishing/preview
GET  /api/games/{game_id}/publishing/validate
POST /api/games/{game_id}/publishing/publish
POST /api/games/{game_id}/publishing/unpublish
```

Phase 12 certificate endpoints:

```text
GET  /api/player/certificates
POST /api/player/games/{game_id}/certificates
GET  /api/player/certificates/{certificate_id}/download
```

## Database

```bash
docker compose up -d postgres
```

Default local database URL:

```text
postgresql+psycopg://riskwatch:riskwatch@localhost:5432/riskwatch
```

## Environment

Copy the example files before running services:

```bash
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
```

To use OpenAI for topic extraction, blueprint creation, and level generation, add your
API key to `backend\.env`:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.4-mini
```

The backend uses structured outputs and falls back to its local generator when no key
is configured or when `OPENAI_ALLOW_LOCAL_FALLBACK=true` and an API request fails.

## Phase Status

- Phase 0: Product setup, repository, and design system complete.
- Phase 1: Authentication and role-based access complete.
- Phase 2: Creator game draft setup complete.
- Phase 3: Document upload and processing complete.
- Phase 4: AI topic extraction complete.
- Phase 5: Game blueprint creation complete.
- Phase 6: Level-by-level AI generation complete and smoke verified.
- Phase 7: Level review and editor complete and smoke verified.
- Phase 8: Reward system complete and smoke verified.
- Phase 9: Branching path editor complete and smoke verified.
- Phase 10: Player gameplay engine complete and smoke verified.
- Phase 11: Preview, validation, immutable version publishing, and unpublishing complete and smoke verified.
- Phase 12: Version-pinned completion certificates and PDF downloads implemented; smoke coverage added.
