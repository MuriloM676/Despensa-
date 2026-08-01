# Spec: Notifications

## Status

Draft (target: MVP 3)

## Objective

Keep household members informed about expiring items, low stock and list
updates, on the device of their choice.

## Notes

- Relies on the expiration engine (MVP 1) and alerts (MVP 2).
- Requires a background worker / scheduler and Redis-backed queues.

## Functional Requirements (planned)

**FR-001** In-app notification center listing recent alerts.

**FR-002** Push notifications for expiring items and low stock.

**FR-003** Per-user notification preferences.

## Business Rules (planned)

**BR-001** Notifications are scoped to a household.

**BR-002** A user receives notifications only for households they belong to.

## Open questions

- Which channels first: in-app, email, push (web push via PWA)?
- Batch schedule (daily digest vs. real time)?
