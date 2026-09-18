# Despensa+ — production image for the Next.js web app.
#
# Built from the repository root (see docker-compose.yml):
#   docker compose build web
#   docker compose up --build
#
# On startup the container applies pending Prisma migrations
# (`prisma migrate deploy`) before launching `next start`, so the `postgres`
# service must be reachable through DATABASE_URL (wired in docker-compose.yml).

FROM node:20-alpine AS builder

# Prisma engines need OpenSSL on Alpine.
RUN apk add --no-cache openssl libc6-compat

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

WORKDIR /app

# Install workspace dependencies first for better layer caching.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --store-dir=/app/.pnpm-store

# Build the app. `next build` needs *some* env values present but never real
# secrets: dummy build-only values are used here; the runtime env (compose
# `environment` / `env_file`) overrides them inside the container.
COPY . .
# apps/web's build script loads ../../.env via dotenv-cli, which errors when
# the file is missing; an empty file is enough because ENV already provides
# the dummy values (existing env wins over dotenv files).
RUN touch .env
ENV DATABASE_URL="postgresql://despensa:despensa@localhost:5432/despensa?schema=public" \
  REDIS_URL="redis://localhost:6379" \
  AUTH_SECRET="build-only-dummy-secret-not-used-at-runtime" \
  AUTH_URL="http://localhost:3000" \
  NEXT_PUBLIC_APP_URL="http://localhost:3000"
RUN pnpm db:generate && pnpm build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV="production" \
  PORT="3000" \
  HOSTNAME="0.0.0.0" \
  PNPM_HOME="/pnpm" \
  PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

WORKDIR /app

# Same absolute paths as the builder stage, so pnpm's symlinks into
# /app/.pnpm-store keep resolving.
COPY --from=builder /app /app

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @despensa/database db:deploy && pnpm --filter @despensa/web exec next start"]
