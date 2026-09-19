# Spec: Stock History

## Status

Accepted (MVP 2)

## Objective

Keep a household-scoped history of stock movements (purchases and
consumptions) so members can see what entered and left the pantry, and so
future features (consumption-based replenishment, MVP 3) have data to work
with.

## Concepts

### StockEvent

An immutable record of one stock movement:

- `PURCHASE` — stock entered the household (manual add or purchase-to-stock
  from a shopping list, which funnels through the same service).
- `CONSUME` — stock left the household through a FEFO consumption.
- `REMOVE` — a stock entry was discarded manually.

Events carry the product, the quantity moved (always positive, 3dp) and a
timestamp. Events are never updated or deleted through the app; deleting a
product cascades to its events.

## Functional Requirements

**FR-001** Every inventory addition records one `PURCHASE` event with the
added quantity.

**FR-002** Every FEFO consumption records one `CONSUME` event with the total
consumed quantity.

**FR-003** Every manual removal records one `REMOVE` event with the removed
entry's quantity.

**FR-004** Users can view recent movements on the dashboard and the full
history on a dedicated page, optionally filtered by product.

## Business Rules

**BR-001** History recording is atomic with the movement itself: the event is
written inside the same transaction as the stock write, so a failed movement
leaves no event and a committed movement always has one.

**BR-002** Event quantities are positive numbers with at most 3 decimal
places, matching the inventory decimal discipline.

**BR-003** History is read-only from the UI: no edit or delete action exists.
Events are scoped to the household; cross-household reads are rejected by the
same household scoping as inventory.

**BR-004** A `CONSUME` event records the aggregate consumed quantity per
consumption call (one event per call, not one per FEFO lot touched).

## Acceptance Criteria

**AC-001** Given a product with no stock, when the user adds `2` units, then
one `PURCHASE` event with quantity `2` exists for that product.

**AC-002** Given stock of `3` units, when the user consumes `1.5` units, then
one `CONSUME` event with quantity `1.5` exists, even if multiple FEFO lots
were touched.

**AC-003** Given a failed consumption (insufficient stock), when the error is
returned, then no `CONSUME` event was recorded.

**AC-004** Given events for two products, when the history is filtered by one
product, then only that product's events are returned, newest first.
