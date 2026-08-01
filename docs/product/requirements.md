# Requirements

Status: Draft for MVP 1. Detailed functional requirements live in the feature
specs in `docs/specs/`. This document collects the cross-cutting requirements.

## MVP 1

- [x] Authentication: register and sign in with email + password.
- [x] Household: every user belongs to a household; a household is created on
      first sign-in.
- [x] Products: users can manage the product catalog of their household.
- [x] Inventory: users can register stock entries with quantity, purchase date
      and optional expiration date.
- [x] Expiration: items are automatically classified as valid, expiring soon or
      expired based on their expiration date.
- [x] Shopping lists: users can create lists, add items and check them off.

## MVP 2

- Dashboard with expiration and low-stock alerts.
- Minimum stock levels per product.
- Replenishment suggestions.
- Purchase and consumption history.

## MVP 3

- PWA.
- Notifications (push / scheduled).
- Household sharing and member management.
- Barcode scanner.

## Later / AI phase

- Consumption forecast.
- Shopping suggestions.
- Recipe suggestions.
- Waste detection.
- Habit analysis.

## Cross-cutting requirements

- All external input is validated with Zod.
- All database changes require a Prisma migration.
- Every feature ships with tests.
- UI copy is in Portuguese (pt-BR); code and documentation are in English.
