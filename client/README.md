# Ticket Analyzer — Member 2 Frontend

This package contains Niloy's React/Vite frontend deliverable plus a temporary, dependency-free dummy backend. The dummy backend uses in-memory data and simple keyword sentiment so frontend development can begin before Docker and the real FastAPI service are ready.

## Project structure

```text
frontend/
  src/
    App.jsx
    TicketForm.jsx
    TicketList.jsx
dummy-backend/
  server.mjs
```

## Prerequisite

Install the current Node.js LTS release from https://nodejs.org/ and reopen the terminal. Docker is not needed for this version.

If Docker Desktop is installed, Node.js does not need to be installed separately.

## Run with Docker (recommended)

From this project folder:

```powershell
docker compose up --build -d
```

Open http://localhost:3000. The dummy API is also available at http://localhost:8000/health.

To view logs or stop the project:

```powershell
docker compose logs -f
docker compose down
```

## Run locally

Open two terminals in this project folder.

Terminal 1 — dummy backend:

```powershell
cd dummy-backend
npm start
```

Terminal 2 — React frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in a browser. Vite forwards `/api` calls to the dummy backend on port 8000.

## Production-backend handoff

The frontend uses `VITE_API_BASE_URL`, defaulting to `/api` as required by the PRD. When the real Nginx/FastAPI setup is ready, keep `/api`; Nginx should proxy it to the FastAPI backend. For a direct backend URL during development, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The temporary backend stores submitted tickets only in memory. Restarting it restores the two sample tickets.
