# Architecture

## Overview

Despensa+ is a modular monorepo. Business logic is isolated from the UI and from
database access, so features can grow and change without coupling.

## Layers

```
┌─────────────────────────────────────────────┐
│  apps/web — Next.js (React Server Components,│
│             Server Actions, pages)           │
├─────────────────────────────────────────────┤
│  apps/web/src/server — services              │
│  (business logic, read + write, Zod)         │
├─────────────────────────────────────────────┤
│  packages/database — Prisma client, schema,  │
│  migrations, seed                            │
├─────────────────────────────────────────────┤
│  PostgreSQL 17 · Redis 8 (Docker)            │
└─────────────────────────────────────────────┘
```

## Dependency direction

```
apps/web → packages/ui
apps/web → packages/types
apps/web → packages/database (only via @despensa/database client)
apps/web → packages/config (dev-time)
```

- Apps import packages.
- Packages never import apps.
- `packages/database` is the only place that touches Prisma.
- `packages/ui` is presentational and does not import app features.

## Request flow

### Reading data (server components)

```
Page (RSC) → service function in apps/web/src/server → Prisma client → DB
```

### Writing data (mutations)

```
Form → Server Action → Zod validation → service function → Prisma client → DB
```

The same service functions are used by both reads and writes where it makes
sense, keeping behavior consistent.

## Domain model

- **User** — account used to sign in.
- **Household** — the shared unit that owns products, inventory and lists.
- **HouseholdMember** — link between a user and a household, with a role.
- **Product** — an item *type* (Milk, Rice). Belongs to a household.
- **ProductCategory** — optional grouping for products.
- **InventoryItem** — a concrete *stock entry*: product + quantity + purchase
  date + optional expiration date. A product can have many entries (enables
  FEFO).
- **ShoppingList** / **ShoppingListItem** — lists of items to buy, optionally
  linked to a product.

The separation between Product and InventoryItem is a core decision: it is what
allows expire-first (FEFO) consumption.

## Inventory engine

Consumption of stock is FEFO: entries with the nearest expiration date are
consumed first; entries without an expiration date are consumed last.

See `docs/specs/inventory.md` for the detailed rules.

## Key files

- `apps/web/src/server/` — service functions (the only place with business logic)
- `apps/web/src/app/` — Next.js App Router pages
- `apps/web/src/lib/validations/` — Zod schemas
- `packages/database/prisma/schema.prisma` — the data model
