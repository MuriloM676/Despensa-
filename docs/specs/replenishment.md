# Spec: Replenishment Suggestions

## Status

Accepted (MVP 2)

## Objective

Suggest what to buy next based on low stock and consumption history.

## Notes

- Requires minimum stock levels per product (MVP 2, `Product.minStockLevel`)
  and consumption history (`StockEvent`, see `stock-history.md`).
- MVP 2 suggestions restore the minimum level only. Average-consumption
  forecasting (FR-004) stays a later item.
- Suggestions are display-only in MVP 2: they do not auto-fill a shopping
  list (open question resolved: display only).

## Functional Requirements

**FR-001** Users can set a minimum stock level per product (default `0`,
meaning "no minimum").

**FR-002** The system flags products whose available stock is below the
minimum, with a low-stock badge on the dashboard, inventory and products
surfaces.

**FR-003** The system suggests quantities to buy to restore the minimum
(suggested quantity = minimum minus current stock).

**FR-004** (Later, MVP 3) Suggestions consider average consumption per period,
computed from `StockEvent` history.

## Business Rules

**BR-001** Minimum stock level must be a non-negative number: zero or more,
multiples of `0.001`, at most `1_000_000` (same decimal discipline as
inventory quantities, BR-001 of `inventory.md`). Input accepts both `.` and
`,` as the decimal separator (pt-BR).

**BR-002** A product is low-stock when its minimum is greater than zero and
its total available stock (sum of non-consumed entries with quantity greater
than zero) is strictly below the minimum. Expiration dates are ignored for
this check: a product below minimum is flagged regardless of expiration.

**BR-003** The suggested replenishment quantity is `minimum - stock`,
rounded to 3 decimal places. It is always positive when BR-002 holds.

**BR-004** Products with minimum `0` (unset) never appear as low-stock and
never produce suggestions.

## Acceptance Criteria

**AC-001** Given a product with minimum `5` and stock `2`, when the dashboard
is displayed, then the product is flagged low-stock with a suggested quantity
of `3`.

**AC-002** Given a product with minimum `0` and stock `0`, when the dashboard
is displayed, then the product is NOT flagged low-stock.

**AC-003** Given a product with minimum `2.5` and stock `2.5`, when the
dashboard is displayed, then the product is NOT flagged (equal is not below).

**AC-004** Given a low-stock product whose stock is expired, when the
dashboard is displayed, then the product still appears in the low-stock /
replenishment section.
