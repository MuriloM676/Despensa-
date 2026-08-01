# Spec: Replenishment Suggestions

## Status

Draft (target: MVP 2)

## Objective

Suggest what to buy next based on low stock and consumption history.

## Notes

- Requires minimum stock levels per product (MVP 2) and consumption history.
- "Next purchase" suggestions will combine minimum stock, average consumption
  and current stock.

## Functional Requirements (planned)

**FR-001** Users can set a minimum stock level per product.

**FR-002** The system flags products whose available stock is below the
minimum.

**FR-003** The system suggests quantities to buy to restore the minimum.

**FR-004** (Later) Suggestions consider average consumption per period.

## Business Rules (planned)

**BR-001** Minimum stock level must be a non-negative number.

**BR-002** A product below minimum stock is flagged regardless of expiration
dates.

## Open questions

- Should suggestions auto-fill a shopping list or only be displayed?
- How is consumption measured before history exists?
