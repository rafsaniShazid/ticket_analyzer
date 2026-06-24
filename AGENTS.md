# AGENTS.md

## Team Ownership

- Member 1 owns `backend/app/**`, backend API behavior, SQLAlchemy models, Hugging Face sentiment code, and backend dependency manifests.
- Member 2 owns `frontend/src/**`, React components, frontend API calls, frontend styling, `package.json`, lockfiles, and Vite configuration.
- Member 3 owns Docker, Compose, Nginx, `.env.example`, ignore files, README, PRD, and this agent guide.

## Do Not Modify

Agents must not modify teammate-owned source or dependency files unless the user explicitly changes the scope:

- `backend/app/**`
- backend application logic
- backend dependency manifests
- `frontend/src/**`
- frontend application logic
- frontend dependency manifests
- existing API contracts

If the project cannot work without changing an out-of-scope file, stop and report the exact file, reason, smallest recommended change, and responsible team member.

## Architecture

```text
Browser -> Nginx frontend -> /api proxy -> FastAPI backend -> Hugging Face model -> PostgreSQL
```

Expected ports:

- Frontend: `3000`
- Backend: `8000`
- PostgreSQL: internal `5432`

## API Endpoints

- `GET /health`
- `POST /tickets`
- `GET /tickets`

Frontend traffic should use `/api/health` and `/api/tickets` through Nginx.

## Local Verification Commands

Run what is possible in the current environment:

```powershell
git status
git diff --check
docker compose config
docker compose -f docker-compose.prod.yml config
docker compose build
docker compose up --build -d
docker compose ps
docker compose logs --no-color --tail=200
curl.exe -f http://localhost:8000/health
curl.exe -f http://localhost:3000/api/health
git diff --name-only origin/main...HEAD
```

Do not run `docker compose down -v` without explicit approval because it deletes the local PostgreSQL data volume.

## Docker And Documentation Conventions

- Keep Dockerfiles production-oriented.
- Do not run backend or frontend dev reload servers in production containers.
- Keep `VITE_API_BASE_URL=/api` for hostname-independent deployments.
- Use placeholder values in `.env.example`.
- Never document unverified deployment success.
- Never invent Puku CLI syntax; verify it from installed help output first.

## No Secrets

Never commit passwords, access keys, API tokens, session cookies, VM credentials, or real DockerHub secrets. `.env` is ignored and `.env.example` must remain safe to publish.

## Pull Request Expectations

- Keep changes limited to Member 3 allowed files.
- Before handoff, run `git diff --name-only origin/main...HEAD`.
- Confirm no teammate-owned source files changed.
- Include passed checks, failed checks, and blocked checks in the PR description.
- Do not commit, push, merge, force-push, or rewrite history unless the user explicitly approves.

## Integration Rule

Always inspect the current teammate code before changing integration files. Backend and frontend branch structure may move during the hackathon, so confirm paths and entry points before assuming they are final.
