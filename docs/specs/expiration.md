# Spec: Expiration Alerts

## Status

Accepted (MVP 2)

## Objective

Proactively surface products that are about to expire or already expired on
the dashboard. External notifications (push/email) stay MVP 3 (see
`notifications.md`).

## Notes

- The expiration status computation itself (`expired`, `expiring_soon`, `valid`)
  is implemented in MVP 1 as part of the inventory spec.
- This spec covers the dashboard alerts widget with a per-household
  configurable alert window. Scheduled/push notifications are MVP 3.

## Functional Requirements

**FR-001** A dashboard widget lists items expiring soon, sorted by date
(earliest first).

**FR-002** Items already expired are listed separately from items expiring
soon (two sections, expired first).

**FR-003** (MVP 3) Household members receive notifications about expiring items.

## Business Rules

**BR-001** Alert window for "expiring soon" is configurable per household
(`Household.alertWindowDays`, default 5 days). Accepted values are integers
from 1 to 30 days. The status stays computed dynamically (no stored flag):
`expired` when the date is before today, `expiring_soon` when it is within
the window (inclusive of today), `valid` otherwise or without a date.

**BR-002** The dashboard renders expired and expiring-soon items in separate
sections. Items without an expiration date never appear in either section.

## Acceptance Criteria

**AC-001** Given a household with window `5` and items expiring in 3 days and
in 10 days, when the dashboard is displayed, then only the 3-day item appears
in "expiring soon".

**AC-002** Given a household with window `10` and an item expiring in 7 days,
when the dashboard is displayed, then the item appears in "expiring soon".

**AC-003** Given expired and expiring-soon items, when the dashboard is
displayed, then expired items render in a separate section from expiring-soon
items, each sorted by date ascending.

**AC-004** Given an alert window update to `3`, when the dashboard is
displayed, then items expiring in 4+ days are no longer listed as expiring
soon.
