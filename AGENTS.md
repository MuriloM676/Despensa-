# Despensa+

## Project Overview

Despensa+ is a web application for managing household inventory, shopping lists
and product expiration dates. It helps households track what they bought, when
items expire, and what to buy next.

## Tech Stack

- Next.js 16 (App Router, Server Components, Server Actions, Turbopack)
- TypeScript (strict mode, ESM)
- PostgreSQL 17 (primary database)
- Redis 8 (infrastructure, reserved for future features)
- Prisma 7 (ORM, TypeScript runtime)
- Auth.js v5 (`next-auth@beta`, credentials provider)
- Tailwind CSS
- Docker + Docker Compose
- Turborepo + pnpm (monorepo)
- Vitest (testing)

## Repository Layout

```
apps/web        Next.js application
packages/config Shared TypeScript, ESLint and Prettier configs
packages/types  Shared domain types
packages/database Prisma schema, client, migrations and seed
packages/ui     Shared UI components (Tailwind)
docs            Product, architecture, specs and database documentation
```

## Architecture

- Modular architecture. Business logic must not live inside React components.
- React Server Components read data through service functions in `apps/web/src/server`.
- Mutations go through Server Actions that call the same services with Zod validation.
- Database access is isolated in `packages/database`. No other package touches Prisma directly.
- Apps import packages; packages never import apps.

## Rules

- TypeScript strict mode. No `any`.
- No unnecessary dependencies.
- Prefer server-side operations when appropriate.
- Validate all external input with Zod.
- Never expose secrets to the client.
- All database changes require a Prisma migration.
- Every feature must have tests.
- No `console.log` in committed code.
- Business rule changes update specs first, then code.

## Docker

The application must run using Docker Compose. Never assume dependencies are
installed directly on the host machine.

- `docker compose up -d` starts `postgres` and `redis`.
- `docker compose up --build` starts the full stack (web + postgres + redis).
- Databases live in named volumes.

## Development

Before implementing a feature:

1. Read the relevant specification in `docs/specs/`.
2. Read `docs/architecture/` and existing `docs/architecture/decisions.md` (ADRs).
3. Check the database schema in `packages/database/prisma/schema.prisma`.
4. Plan the implementation.
5. Implement following existing patterns.
6. Run tests (`pnpm test`), typecheck (`pnpm typecheck`) and lint (`pnpm lint`).
7. Update documentation if necessary.

## Commands

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # start the web app in development
pnpm build            # build all packages and apps
pnpm test             # run all tests
pnpm typecheck        # typecheck the whole workspace
pnpm lint             # lint the whole workspace
pnpm db:migrate       # create/apply a new migration (in packages/database)
pnpm db:generate      # regenerate the Prisma client
pnpm db:seed          # seed the database
pnpm db:studio        # open Prisma Studio
```

## Documentation Style

- Documentation is written in English.
- UI copy and user-facing strings are written in Portuguese (pt-BR).
- Code identifiers, types, schemas and comments are written in English.
