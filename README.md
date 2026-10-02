# API Application

Reserved for the Node.js, NestJS, and TypeScript modular-monolith API. Initialize this application with NestJS modules for authentication, users, interviews, questions, answers, evaluations, and AI; preserve their documented exports and public provider boundaries.

NestJS uses Express through its default adapter unless explicitly configured otherwise, but the application structure must remain NestJS-first: modules, injectable providers, controllers, DTOs, pipes, guards, interceptors, and exception filters.

See [backend architecture](../../docs/architecture/backend.md).

## Production Build

```bash
npm ci
npm run generate --workspace=@ai-interview-platform/api   # Prisma Client
npm run build --workspace=@ai-interview-platform/api      # tsc -> apps/api/dist
npm run start:prod --workspace=@ai-interview-platform/api # node dist/main.js
```

## Docker

[Dockerfile](Dockerfile) builds a multi-stage production image intended for deployment to AWS ECS (Fargate or ECS Express Mode). It installs dependencies for this workspace only, generates Prisma Client, compiles TypeScript, and ships only `dist/`, production dependencies, and the generated client. The container runs as the unprivileged `node` user and starts with `node dist/main.js`.

The image contains no environment files or secrets. It does **not** run database migrations; apply migrations as a separate, explicit release step before starting new tasks.

All Docker files for the API live in this folder: [Dockerfile](Dockerfile), [Dockerfile.dockerignore](Dockerfile.dockerignore), and [compose.yml](compose.yml). Nothing outside `apps/api` references them.

### Build

While the API is part of the monorepo, the build context is the repository root because the npm workspace lockfile and `tsconfig.base.json` live there. BuildKit picks up `Dockerfile.dockerignore` automatically.

```bash
docker build -f apps/api/Dockerfile -t interview-platform-api .   # from the repository root
```

### Run locally

`compose.yml` runs only the API; it does not start PostgreSQL. It reads `apps/api/.env` and connects to the database published on the host (for example by the monorepo's `npm run db:up`) through `host.docker.internal`, building `DATABASE_URL` from `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, and `POSTGRES_DB`. Set `DOCKER_DATABASE_URL` to use another database, and `API_PORT` to change the published host port.

```bash
docker compose -f apps/api/compose.yml up --build --detach   # from the repository root
docker compose -f apps/api/compose.yml logs --follow api
docker compose -f apps/api/compose.yml down                  # stop and remove the container
```

From inside `apps/api`, drop `-f apps/api/compose.yml`.

Or with plain Docker (Linux needs the `--add-host` flag; Docker Desktop provides `host.docker.internal`):

```bash
docker run --rm --name interview-platform-api \
  --env-file apps/api/.env \
  --env NODE_ENV=production \
  --env DATABASE_URL='postgresql://<user>:<password>@host.docker.internal:5432/<db>?schema=public' \
  --add-host host.docker.internal:host-gateway \
  --publish 3001:3001 \
  interview-platform-api

docker stop interview-platform-api               # sends SIGTERM; NestJS shuts down gracefully
```

A connection string using `localhost` refers to the container itself; use `host.docker.internal` or a real database host.

### Moving to its own repository

The Docker setup is self-contained, but three monorepo couplings remain and must change when the API is extracted:

1. Generate a `package-lock.json` for the API and copy `tsconfig.base.json` into it (or inline it into `tsconfig.json`).
2. In the Dockerfile, drop the `apps/api/` path prefixes and `--workspace`/`--include-workspace-root` flags, and build with `docker build -t interview-platform-api .`.
3. Rename `Dockerfile.dockerignore` to `.dockerignore` and set `build.context: .` and `dockerfile: Dockerfile` in `compose.yml`.

### Production command

The image's default command is the production entrypoint; configuration is supplied only as environment variables (in ECS, through the task definition with secrets from AWS Secrets Manager or SSM Parameter Store):

```bash
docker run --detach --publish 3001:3001 --env-file <runtime-env-file> interview-platform-api
```

### Environment variables

Validated at startup by [environment.validation.ts](src/infrastructure/config/environment.validation.ts); the container exits if a required value is missing. See [.env.example](.env.example).

| Variable                                                                 | Required | Notes                                                             |
| ------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL`                                                           | Yes      | PostgreSQL connection URL. Secret.                                |
| `AUTH_SECRET`                                                            | Yes      | At least 32 characters. Secret.                                   |
| `OPENAI_API_KEY`                                                         | Yes      | Secret.                                                           |
| `OPENAI_CV_EXTRACTION_MODEL`, `OPENAI_CANDIDATE_EVALUATION_MODEL`        | Yes      | Model identifiers.                                                |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM` | Yes      | `SMTP_PASSWORD` is secret.                                        |
| `WEB_APP_URL`                                                            | Yes      | HR web origin used in links.                                      |
| `NODE_ENV`                                                               | No       | Image default `production`.                                       |
| `PORT`                                                                   | No       | Default `3001`; the image exposes `3001`.                         |
| `CORS_ORIGIN`                                                            | No       | Comma-separated browser origins. Set it explicitly in deployment. |
| `INTERVIEW_APP_URL`                                                      | No       | Defaults to `WEB_APP_URL`.                                        |
| `OPENAI_TIMEOUT_MS`                                                      | No       | Default `30000`.                                                  |
| `MATCH_REQUIRED_TECHNOLOGY_WEIGHT`, `MATCH_PREFERRED_TECHNOLOGY_WEIGHT`  | No       | Defaults `70` / `30`; must total 100.                             |

### Health checks

- `GET /api/v1/health/live` — liveness; no database access. Use this for the ALB target group, the ECS container health check, and the image `HEALTHCHECK`.
- `GET /api/v1/health` — readiness; runs `SELECT 1` and returns `503` when PostgreSQL is unavailable.

```bash
curl http://localhost:3001/api/v1/health/live
docker inspect --format '{{.State.Health.Status}}' interview-platform-api
```
