# Security

## Principles

- **Never expose secrets to the client.** Environment variables are read only
  in server code. `NEXT_PUBLIC_*` variables are used only for values that are
  safe to publish.
- **Validate all external input with Zod.** Every Server Action validates its
  payload before touching the database.
- **Defense in depth.** Route protection exists at the middleware level *and*
  inside Server Components / actions. Never rely on middleware alone (see
  CVE-2025-29927 class of issues).
- **Least privilege.** Queries are scoped to the current user's household.
  Every read/write goes through services that inject the authenticated
  household id.

## Authentication

- Passwords are hashed with bcrypt before storage. Plain text passwords are
  never persisted or logged.
- Auth.js v5 manages sessions with JWT strategy, which is edge-compatible.
- `AUTH_SECRET` must be a strong random value and never committed.

## Authorization (household scoping)

- All household-owned data (products, inventory, lists) is filtered by the
  authenticated user's household id.
- A user can only access households they belong to (via `household_members`).
- Service functions receive the acting user and derive the household, so a
  caller cannot request an arbitrary household id.

## Database

- Connection string is passed via `DATABASE_URL` from the environment.
- No sensitive data is stored in plain text.
- Migrations are reviewed as code changes.

## Input validation

- Zod schemas define the shape of every mutation input (see
  `apps/web/src/lib/validations/`).
- Validation failures are reported to the user without leaking internals.

## Dependencies

- Keep dependencies minimal (rule: no unnecessary dependencies).
- Track security advisories and update Next.js, Auth.js and Prisma in lockstep.
