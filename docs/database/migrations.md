# Migrations

Migrations live in `packages/database/prisma/migrations/` and are managed by
Prisma Migrate.

## Workflow

```bash
# create/apply a new migration (in packages/database)
pnpm db:migrate

# regenerate the client after a schema change
pnpm db:generate

# apply migrations to a deployed database
pnpm db:deploy
```

## Rules

- Every schema change requires a migration. Never edit the database by hand.
- Never edit an already-applied migration. Create a new one instead.
- Review generated SQL before applying to a shared database.
- Keep migrations small and focused on one logical change.

## Current migration

- `0000_init` — initial schema for MVP 1 (users/auth adapter tables,
  households, members, products, categories, inventory items, shopping lists).
