# Despensa+

Smart home inventory, shopping lists and expiration tracking.

Despensa+ helps households register what they bought and then takes care of the
stock, expiration dates and the next shopping list.

## MVP 1 features

- Authentication (email + password, Auth.js v5)
- Households and members
- Products and categories
- Inventory with expiration dates (FEFO consumption)
- Shopping lists

## Documentation

| Area | Files |
| --- | --- |
| Product | `docs/product/vision.md`, `requirements.md`, `personas.md`, `roadmap.md` |
| Architecture | `docs/architecture/architecture.md`, `decisions.md`, `security.md`, `infrastructure.md` |
| Specs | `docs/specs/*.md` |
| Database | `docs/database/schema.md`, `migrations.md` |

`AGENTS.md` at the repository root is the manual for AI agents working on this
project. Read it before contributing.

## Getting started

Prerequisites: Node.js 20+, pnpm (via corepack) and Docker Compose.

```bash
corepack enable
corepack prepare pnpm@latest --activate

cp .env.example .env        # fill in secrets
docker compose up -d        # postgres + redis
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev                    # http://localhost:3000
```

## Commands

```bash
pnpm dev            # start the web app in development
pnpm build          # build all packages and apps
pnpm test           # run all tests
pnpm typecheck      # typecheck the whole workspace
pnpm lint           # lint the whole workspace
pnpm db:migrate     # create/apply a new migration (in packages/database)
pnpm db:generate    # regenerate the Prisma client
pnpm db:seed        # seed the database
pnpm db:studio      # open Prisma Studio
```

## Repository layout

```
apps/web        Next.js application
packages/config Shared TypeScript, ESLint and Prettier configs
packages/types  Shared domain types
packages/database Prisma schema, client, migrations and seed
packages/ui     Shared UI components (Tailwind)
docs            Product, architecture, specs and database documentation
```

## Roadmap

See `docs/product/roadmap.md`. MVP 2 adds dashboards, low-stock alerts,
replenishment suggestions and history. MVP 3 adds PWA, notifications, household
sharing and barcode scanning. AI features come later.
