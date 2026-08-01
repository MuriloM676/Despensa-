# Spec: Expiration Alerts

## Status

Draft (target: MVP 2)

## Objective

Proactively surface products that are about to expire or already expired, and
notify household members.

## Notes

- The expiration status computation itself (`expired`, `expiring_soon`, `valid`)
  is implemented in MVP 1 as part of the inventory spec.
- This spec covers the dashboard alerts widget and, later, push/scheduled
  notifications.

## Functional Requirements (planned)

**FR-001** A dashboard widget lists items expiring soon, sorted by date.

**FR-002** Items already expired are listed separately from items expiring soon.

**FR-003** (MVP 3) Household members receive notifications about expiring items.

## Business Rules (planned)

**BR-001** Alert window for "expiring soon" is configurable per household
(default 5 days).

## Open questions

- Should alerts dismiss after being seen?
- Notification channels: in-app, email, push?
