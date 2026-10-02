# syntax=docker/dockerfile:1
#
# Production image for the NestJS API (apps/api).
# While the API lives in the monorepo, the build context is the repository root because the npm
# workspace lockfile and tsconfig.base.json live there (see README "Moving to its own repository"):
#   docker build -f apps/api/Dockerfile -t interview-platform-api .
# Build-context exclusions are in Dockerfile.dockerignore next to this file.
#
# No secrets or environment-specific values are baked in; all configuration (DATABASE_URL,
# AUTH_SECRET, OPENAI_API_KEY, SMTP_*, ...) is injected at runtime by Docker, Compose, or ECS.

ARG NODE_VERSION=22

# ---- dependencies: full install (including dev tooling) for the API workspace ----
FROM node:${NODE_VERSION}-alpine AS dependencies
WORKDIR /app

# Only the API workspace manifest is needed; npm installs just this workspace's dependencies from
# the shared lockfile, so no other app in the monorepo is referenced.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace=@ai-interview-platform/api --include-workspace-root=false --no-audit --no-fund

# ---- build: generate Prisma Client and compile TypeScript ----
FROM dependencies AS build
WORKDIR /app
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
# prisma.config.ts resolves DATABASE_URL eagerly; `prisma generate` never connects, so a
# placeholder is supplied for this command only (not persisted as ENV in any image layer).
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
      npm run generate --workspace=@ai-interview-platform/api \
    && npm run build --workspace=@ai-interview-platform/api

# ---- production-dependencies: runtime packages only ----
FROM node:${NODE_VERSION}-alpine AS production-dependencies
WORKDIR /app
COPY --from=dependencies /app/package.json /app/package-lock.json ./
COPY --from=dependencies /app/apps/api/package.json apps/api/package.json
RUN npm ci --workspace=@ai-interview-platform/api --include-workspace-root=false --omit=dev --omit=optional \
      --no-audit --no-fund \
    && npm cache clean --force

# ---- runtime: compiled application, production dependencies, generated Prisma Client ----
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules node_modules
# The generated client lives in node_modules/.prisma; the `prisma` CLI that produces it is a dev
# dependency, so the generated output is copied instead of regenerating it here.
COPY --from=build --chown=node:node /app/node_modules/.prisma node_modules/.prisma
COPY --from=build --chown=node:node /app/apps/api/package.json apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist apps/api/dist

WORKDIR /app/apps/api
# Run as the unprivileged user shipped with the official Node.js image.
USER node

# Matches the API's default PORT (3001). Override PORT at runtime to change the listening port.
EXPOSE 3001

# Liveness only: does not touch PostgreSQL, so a database blip does not restart healthy tasks.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider "http://127.0.0.1:${PORT:-3001}/api/v1/health/live" || exit 1

# Run node directly (not through npm) so SIGTERM from Docker/ECS reaches the process and NestJS
# shutdown hooks close the HTTP server and Prisma connections.
CMD ["node", "dist/main.js"]
