# Infrastructure

## Local development

Everything runs with Docker Compose. Never assume dependencies are installed on
the host machine.

```
web       Next.js dev server (port 3000)
postgres  PostgreSQL 17 (named volume)
redis     Redis 8-alpine (named volume)
```

- `docker compose up -d` starts `postgres` and `redis`.
- `docker compose up --build` starts the full stack including `web`.
- Data lives in named volumes (`postgres_data`, `redis_data`), so it survives
  container recreation.

## Services (current)

| Service | Image / build | Port | Notes |
| --- | --- | --- | --- |
| `web` | local Dockerfile | 3000 | Next.js app |
| `postgres` | `postgres:17` | 5432 | primary database, healthcheck |
| `redis` | `redis:8-alpine` | 6379 | reserved for future use, healthcheck |

`web` depends on `postgres` and `redis` reaching the healthy state.

## Planned

- `worker` — background processing for notifications, forecasts.
- `scheduler` — periodic tasks (expiration checks, replenishment).

Do not add `worker`/`scheduler` until a feature needs them.

## Configuration

All configuration comes from environment variables (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection string.
- `AUTH_SECRET` — secret for Auth.js sessions.
- `AUTH_URL` — public URL of the web app.
- `REDIS_URL` — reserved for future use.

## Deployment (future)

- Web app as a container in any Docker-capable host.
- Postgres and Redis managed externally or as containers, depending on scale.
- Migrations run as a deploy step (`pnpm db:migrate` in `packages/database`).
