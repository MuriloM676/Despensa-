# Architecture Decision Records

ADRs document significant architectural decisions. Each entry follows the
"Decision / Reason / Consequences" format.

---

## ADR-001: PostgreSQL as the primary database

**Status:** Accepted

### Decision

Use PostgreSQL as the primary database, accessed through Prisma ORM.

### Reason

The application has relational data involving users, households, products,
inventory, purchases and shopping lists. PostgreSQL provides strong relational
integrity, mature tooling and is well supported by Prisma. The domain model
(product vs. stock entries, memberships, lists) maps naturally to relations.

### Consequences

- SQL schema is managed through Prisma migrations.
- All database access is isolated in `packages/database`.

---

## ADR-002: Prisma ORM (TypeScript runtime)

**Status:** Accepted

### Decision

Use Prisma 7 (TypeScript-based runtime, no Rust engine) as the ORM.

### Reason

Prisma gives type-safe database access that is easy to work with for AI agents,
a first-class migration workflow, and a schema-as-code source of truth. Prisma 7
removes the Rust engine, making the client ESM-first and lighter.

### Consequences

- Every schema change requires a migration.
- `pnpm db:generate` regenerates the typed client.
- Prisma client lives only in `packages/database`.

---

## ADR-003: Monorepo with Turborepo + pnpm

**Status:** Accepted

### Decision

Structure the repository as a pnpm workspace with Turborepo for task
orchestration, with shared packages (`config`, `types`, `database`, `ui`).

### Reason

The project is expected to grow into multiple surfaces (web app, future worker,
shared UI, shared domain types). A monorepo keeps cross-package changes atomic
and enforces clear boundaries from day one.

### Consequences

- Packages are consumed via `workspace:*` protocol.
- Turbo tasks (`build`, `test`, `lint`, `typecheck`) are cached and parallelized.
- Package scope is `@despensa/*`.

---

## ADR-004: Next.js App Router with Server Actions

**Status:** Accepted

### Decision

Use Next.js App Router with React Server Components for reads and Server
Actions for mutations.

### Reason

Server Components avoid shipping business logic to the client. Server Actions
with Zod validation centralize mutations on the server and keep the stack
simple (no separate API layer needed for MVP 1).

### Consequences

- Reads happen through service functions in `apps/web/src/server`.
- All external input is validated with Zod before touching the database.

---

## ADR-005: Auth.js v5 with credentials provider

**Status:** Accepted

### Decision

Use Auth.js v5 (`next-auth@beta`) with the credentials provider (email +
password, bcrypt hashing), using the Prisma adapter and JWT sessions.

### Reason

Self-hosted and dependency-free for MVP 1, with a path to add OAuth providers
later. Credentials fit the household sharing model where the owner invites
members.

### Consequences

- `users` table plus Auth.js adapter tables (`account`, `session`,
  `verificationToken`) live in `packages/database`.
- Sessions are JWT-based (edge-compatible middleware).
- Passwords are hashed with bcrypt; never stored in plain text.

---

## ADR-006: Redis included from the start, unused in MVP 1

**Status:** Accepted

### Decision

Include Redis 8 in Docker Compose from day one, but do not use it in MVP 1.

### Reason

Redis is reserved for scheduled notifications, background workers and future
caching. Including it in the compose file keeps the local environment stable so
adding it later does not change the dev setup.

### Consequences

- `docker compose up` starts postgres + redis regardless of use.
- No production code depends on Redis until a feature actually needs it.

---

## ADR-007: Landing without animation dependencies

**Status:** Accepted

### Decision

Remove the landing-page animation dependencies (`gsap`, `@gsap/react`,
`motion`, `ogl`) and reproduce their effects with CSS keyframes plus tiny
vanilla hooks (`IntersectionObserver` reveals, `requestAnimationFrame`
counter and parallax, layered-gradient aurora).

### Reason

The four packages were used only by the public landing page, for effects
that do not need libraries: fade/slide entrances, a number counter, and an
animated gradient wash. Measured cost before removal: `gsap` core 175 kB
raw / 42 kB gzip, `ScrollTrigger` 113 kB / 26 kB, `SplitText` 18 kB / 5 kB
(dist files, before the transitive `motion-dom`/`ogl` weight). A production
build totaled 918 kB of client JS chunks; after removal it is 726 kB
(-192 kB raw, -21%, one chunk fewer) with the same routes and visuals.
Keeping them violated the "no unnecessary dependencies" rule for a
marginal visual difference.

### Consequences

- `apps/web/package.json` no longer lists animation dependencies.
- Landing motion lives in `apps/web/src/app/globals.css` (keyframes) and
  small components (`landing/reveal.tsx`, dependency-free `reactbits/*`).
- `SplitText` splits words instead of measured lines (no layout engine);
  all motion honors `prefers-reduced-motion`.
- If the landing ever needs physics-based or scroll-scrubbed storytelling
  again, re-evaluate then - do not preemptively re-add.
