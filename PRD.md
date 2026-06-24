# Product Requirements Document: Ticket Analyzer

## Product Overview

Ticket Analyzer is a minimal support-ticket demo. A user submits a ticket title, message, and optional category. The backend analyzes sentiment with a Hugging Face model, stores the ticket in PostgreSQL, and returns persisted ticket history to the frontend.

## Demo Objective

Show a complete full-stack path:

```text
React/Vite frontend -> Nginx /api proxy -> FastAPI -> Hugging Face sentiment model -> PostgreSQL
```

The demo must run locally with one Docker Compose command and deploy to a Poridhi Lab VM or AWS VM using DockerHub images.

## Minimal Scope

- Submit a support ticket.
- Analyze ticket message sentiment.
- Store ticket data in PostgreSQL.
- Display persisted ticket history.
- Preserve tickets across page refreshes and container restarts.
- Serve the frontend on port `3000`.
- Serve the backend internally on port `8000`.

Out of scope for the minimal demo: user accounts, authentication, ticket assignment, file attachments, admin dashboards, and custom model training.

## User Flow

1. User opens the frontend.
2. User enters a title, message, and optional category.
3. Frontend sends the ticket to `POST /tickets`.
4. Backend analyzes sentiment using the required Hugging Face model.
5. Backend stores the ticket and sentiment result in PostgreSQL.
6. Frontend displays the saved ticket in ticket history.
7. User refreshes the page and the persisted history is loaded from `GET /tickets`.

## Features

- Ticket creation form with required `title` and `message`.
- Optional `category`.
- Sentiment result: `POSITIVE` or `NEGATIVE`.
- Sentiment confidence score.
- Persisted ticket history.
- Health endpoint for deployment verification.
- Dockerized local and production workflows.

## Architecture

- Browser accesses Nginx frontend on port `3000`.
- Frontend calls `/api`.
- Nginx proxies `/api/health` to backend `/health` and `/api/tickets` to backend `/tickets`.
- Backend talks to PostgreSQL over the internal Compose network.
- Backend loads the sentiment model from the container-local Hugging Face cache.

## API Contract

### `GET /health`

Response:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

### `POST /tickets`

Request:

```json
{
  "title": "Lab VM issue",
  "message": "My lab VM is not opening before the deadline.",
  "category": "lab"
}
```

Response schema:

```json
{
  "id": 1,
  "title": "Lab VM issue",
  "message": "My lab VM is not opening before the deadline.",
  "category": "lab",
  "sentiment": "NEGATIVE",
  "confidence": 0.9981,
  "created_at": "2026-06-24T12:00:00Z"
}
```

### `GET /tickets`

Response:

```json
[
  {
    "id": 1,
    "title": "Lab VM issue",
    "message": "My lab VM is not opening before the deadline.",
    "category": "lab",
    "sentiment": "NEGATIVE",
    "confidence": 0.9981,
    "created_at": "2026-06-24T12:00:00Z"
  }
]
```

## Data Model

Ticket fields:

- `id`: integer primary key
- `title`: required string
- `message`: required text
- `category`: string, defaults to `general` when omitted by the backend
- `sentiment`: required string, expected values `POSITIVE` or `NEGATIVE`
- `confidence`: required float
- `created_at`: creation timestamp

## AI Model Requirement

Required model:

```text
distilbert-base-uncased-finetuned-sst-2-english
```

The model and tokenizer must be downloaded during backend image build and available under `HF_HOME=/opt/hf-cache`. Runtime should use `TRANSFORMERS_OFFLINE=1` so the first API request does not download model files.

## Repository Structure

```text
backend/
  app/
  requirements.txt
  Dockerfile
  .dockerignore
frontend/
  src/
  package.json
  Dockerfile
  .dockerignore
  nginx.conf
docker-compose.yml
docker-compose.prod.yml
.env.example
README.md
PRD.md
AGENTS.md
```

## Environment Variables

```env
POSTGRES_DB=ticket_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
DATABASE_URL=postgresql://postgres:change-me@db:5432/ticket_db
MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
HF_HOME=/opt/hf-cache
TRANSFORMERS_OFFLINE=1
VITE_API_BASE_URL=/api
DOCKERHUB_USERNAME=your-dockerhub-username
IMAGE_TAG=v1
FRONTEND_PORT=3000
BACKEND_PORT=8000
```

No real secrets may be committed.

## Docker Requirements

- Local stack includes `db`, `backend`, and `frontend`.
- PostgreSQL uses a named persistent volume.
- Backend image installs CPU-only PyTorch and declared backend dependencies.
- Backend image preloads the Hugging Face model.
- Frontend image uses a Node build stage and Nginx runtime stage.
- Nginx serves the SPA and proxies `/api/` to FastAPI.

## Deployment Requirements

- Production Compose file pulls DockerHub images instead of building them.
- Frontend is published on port `3000`.
- Backend is reachable through frontend `/api`.
- PostgreSQL persists data in a named volume.
- VM deployment must not require rebuilding images.
- Deployment success must be verified before being claimed.

## Acceptance Criteria

- `docker compose config` succeeds.
- `docker compose -f docker-compose.prod.yml config` succeeds.
- Local stack builds after teammate backend/frontend source is integrated.
- `GET /health` returns healthy database status.
- `POST /tickets` creates a ticket and returns sentiment plus confidence.
- `GET /tickets` returns persisted ticket history.
- Tickets remain after page refresh and container restart.
- Sentiment labels returned by the backend are `POSITIVE` or `NEGATIVE`.
- Backend model can load with `TRANSFORMERS_OFFLINE=1` and no network.
- `git diff --name-only origin/main...HEAD` contains only Member 3 allowed files.
