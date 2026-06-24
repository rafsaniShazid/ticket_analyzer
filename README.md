# Ticket Analyzer

Ticket Analyzer is a minimal full-stack demo for submitting support tickets, analyzing the ticket message with a Hugging Face sentiment model, and storing the result in PostgreSQL.

Repository: https://github.com/rafsaniShazid/ticket_analyzer

## Verification Status

- Replace before deployment: DockerHub image links, live deployed URL, and production database password.
- Verification pending: full container build and runtime checks require the backend and frontend teammate branches to be integrated into the root `backend/` and `frontend/` directories.
- Puku CLI status: unavailable in this local environment, so no Puku command syntax is documented here.

## Architecture

```text
Browser
  -> Nginx frontend container on port 3000
  -> /api reverse proxy
  -> FastAPI backend container on port 8000
  -> Hugging Face sentiment model
  -> PostgreSQL container on internal port 5432
```

The browser calls the frontend on port `3000`. The Vite build uses `VITE_API_BASE_URL=/api`, so API calls stay hostname-independent. Nginx strips `/api` and forwards requests to the backend service inside the Compose network.

## Technology Stack

- React and Vite for the frontend
- Nginx Alpine for serving the production frontend and proxying `/api`
- FastAPI and Uvicorn for the backend API
- SQLAlchemy and PostgreSQL for persistence
- Hugging Face Transformers with `distilbert-base-uncased-finetuned-sst-2-english`
- Docker, Docker Compose, and DockerHub images for deployment

## Repository Structure

```text
backend/
  app/                  # Member 1 owned application code
  requirements.txt      # Member 1 owned dependency manifest
  Dockerfile            # Member 3 owned
frontend/
  src/                  # Member 2 owned React source
  package.json          # Member 2 owned dependency manifest
  Dockerfile            # Member 3 owned
  nginx.conf            # Member 3 owned
docker-compose.yml      # Local build and test stack
docker-compose.prod.yml # VM deployment stack using DockerHub images
PRD.md
AGENTS.md
```

Current integration note: `origin/backend` contains `backend/**`; `origin/developer-2` currently contains frontend files under `client/frontend/**`. The DevOps configuration expects the final app at root `frontend/**`.

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose
- Git
- DockerHub account for image publishing
- A Poridhi Lab VM or AWS VM with Docker installed for deployment
- Puku Editor and Puku CLI in the workshop environment, if required by the event

## Environment Setup

Create a local `.env` from the example file and replace placeholders:

```powershell
Copy-Item .env.example .env
```

Important values:

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

Example value for the current backend branch: because it declares `psycopg[binary]`, the Compose default uses `postgresql+psycopg://postgres:postgres@db:5432/ticket_db`. If Member 1 changes the backend driver dependency, align `DATABASE_URL` with that final implementation.

Never commit `.env`.

## Local Docker Compose

Validate the Compose file:

```powershell
docker compose config
```

Build and run the stack:

```powershell
docker compose up --build -d
```

Inspect status and logs:

```powershell
docker compose ps
docker compose logs --no-color --tail=200
```

Stop the stack without deleting the PostgreSQL volume:

```powershell
docker compose down
```

Do not run `docker compose down -v` unless the team agrees to delete the local database volume.

## API Reference

Health check:

```http
GET /health
```

Expected response:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

Create ticket:

```http
POST /tickets
Content-Type: application/json
```

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

List tickets:

```http
GET /tickets
```

Expected response: an array of ticket response objects ordered newest first by the backend.

Through the frontend container, call the API as `/api/health` and `/api/tickets`.

## Verification Commands

```powershell
curl.exe -f http://localhost:8000/health
curl.exe -f http://localhost:3000/api/health
curl.exe -X POST http://localhost:3000/api/tickets `
  -H "Content-Type: application/json" `
  -d "{\"title\":\"Lab VM issue\",\"message\":\"My lab VM is not opening before the deadline.\",\"category\":\"lab\"}"
curl.exe -f http://localhost:3000/api/tickets
docker compose restart
curl.exe -f http://localhost:3000/api/tickets
```

Persistence is verified when a ticket created before `docker compose restart` is still returned afterward.

## Docker Image Build And Push

Set image metadata:

```powershell
$env:DOCKERHUB_USERNAME = "your-dockerhub-username"
$env:IMAGE_TAG = "v1"
```

Build images:

```powershell
docker compose build
```

Login and push:

```powershell
docker login
docker push "${env:DOCKERHUB_USERNAME}/ticket-analyzer-backend:${env:IMAGE_TAG}"
docker push "${env:DOCKERHUB_USERNAME}/ticket-analyzer-frontend:${env:IMAGE_TAG}"
```

Placeholders:

- DockerHub backend image link: Replace before deployment
- DockerHub frontend image link: Replace before deployment
- Live deployed URL: Verification pending

## Poridhi Or AWS VM Deployment

On the VM:

```powershell
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --no-color --tail=200
```

Open:

```text
http://<vm-public-hostname-or-ip>:3000
```

Verify:

```powershell
curl.exe -f http://<vm-public-hostname-or-ip>:3000/api/health
curl.exe -f http://<vm-public-hostname-or-ip>:3000/api/tickets
```

Do not claim deployment success until these checks pass on the actual VM.

## Offline Hugging Face Verification

The backend image downloads the tokenizer and model at build time under `HF_HOME`. After the image is built, verify offline loading with no network:

```powershell
docker run --rm --network none `
  -e TRANSFORMERS_OFFLINE=1 `
  -e HF_HOME=/opt/hf-cache `
  -e MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english `
  "${env:DOCKERHUB_USERNAME}/ticket-analyzer-backend:${env:IMAGE_TAG}" `
  python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; import os; name=os.environ['MODEL_NAME']; AutoTokenizer.from_pretrained(name); AutoModelForSequenceClassification.from_pretrained(name); print('offline model load ok')"
```

## Puku Editor And CLI

Event requirement: Puku Editor and Puku CLI must be used.

Local verification result:

- `puku --help` failed because `puku` is not installed in this environment.
- POSIX `command -v puku` could not be verified here because Bash/WSL is unavailable.

Workshop action required: fill in the equivalent Puku commands from the workshop environment after running the installed Puku CLI help. Do not invent syntax.

## Troubleshooting

- Build context missing `backend/requirements.txt`: merge or apply Member 1 backend branch into the final integration branch.
- Build context missing `frontend/package.json`: move or merge Member 2 frontend from `client/frontend/**` to root `frontend/**`, or update the agreed DevOps target.
- Frontend install is not reproducible: Member 2 should commit `package-lock.json`.
- Empty frontend category fails validation: Member 2 should omit blank `category` or send `"general"`.
- Sentiment label is lowercase: Member 1 should return `POSITIVE` or `NEGATIVE`.
- Database import error for `psycopg2`: use the `postgresql+psycopg://` URL with the current backend dependencies, or have Member 1 align the DB driver.
- First request tries to download the model: rebuild the backend image and confirm the Dockerfile model-cache step succeeded.

## Security Notes

- `.env` is ignored by Git.
- `.env.example` contains placeholders only.
- No AWS, Poridhi, DockerHub, database, token, or session secret should be committed.
- PostgreSQL is not exposed publicly by default.
- The production API is intended to be reached through the frontend `/api` proxy.

## Team Responsibilities

- Member 1 owns backend application code, FastAPI routes, SQLAlchemy models, dependencies, and Hugging Face sentiment behavior.
- Member 2 owns frontend source, React components, package manifests, Vite configuration, and browser API behavior.
- Member 3 owns Docker, Compose, Nginx, environment examples, repository documentation, and deployment notes.
