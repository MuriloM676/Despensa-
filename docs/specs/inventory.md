# Spec: Inventory

## Status

Accepted (MVP 1)

## Objective

Allow household members to manage the products currently available in their
inventory, tracking quantity, purchase date and expiration date, and to consume
stock following FEFO (first expired, first out).

## User story

As a household member,
I want to register products in my inventory with quantities and expiration
dates,
so that I always know what I have and what is about to expire.

## Concepts

### Product

A product represents an item type. It belongs to a household.

Example: Milk, Rice, Eggs, Coffee.

### InventoryItem

An inventory item represents a concrete stock entry for a product in a
household.

Example:

```
Product:        Milk
Quantity:       2
Purchase date:  2026-08-01
Expiration:     2026-08-10
```

A product can have multiple inventory items with different expiration dates.
This is what enables FEFO consumption.

## Functional Requirements

**FR-001** The user must be able to add an inventory item for a product in
their household.

**FR-002** The user must be able to specify the quantity of an inventory item.

**FR-003** The user may specify a purchase date for an inventory item. Defaults
to the current date.

**FR-004** The user may specify an expiration date for an inventory item.

**FR-005** The user must be able to view the inventory of their household, with
items grouped by product.

**FR-006** The user must be able to consume a quantity of a product from the
inventory.

**FR-007** Expired and about-to-expire items must be identified automatically
and visibly.

**FR-008** The user must be able to remove an inventory item (e.g. thrown away
or given away).

## Business Rules

**BR-001** Quantity must be greater than zero for new items and for
consumption.

**BR-002** Expiration date is optional.

**BR-003** A product may have multiple inventory items.

**BR-004** Consumption must follow FEFO: entries with the earliest expiration
date are consumed first; entries without an expiration date are consumed last.

**BR-005** Consumption cannot result in negative stock.

**BR-006** Expired items are identified automatically by comparing the
expiration date with the current date. No manual flag is stored.

**BR-007** Expiration status is computed dynamically:
- `expired` — expiration date is before today.
- `expiring_soon` — expiration date is within the warning window (default 5
  days, inclusive of today).
- `valid` — anything else, or no expiration date.

## Acceptance Criteria

**AC-001** Given a product with two items (expiring 2026-08-10 and 2026-08-20),
when the user consumes 2 units, then the item expiring 2026-08-10 is reduced
first.

**AC-002** Given an item with quantity 1, when the user tries to consume 2
units, then the operation is rejected and stock is unchanged.

**AC-003** Given an item with an expiration date in the past, when the
inventory is displayed, then the item is marked as expired.

**AC-004** Given an item with an expiration date within 5 days from today, when
the inventory is displayed, then the item is marked as expiring soon.

**AC-005** Given two entries of the same product, one without an expiration
date, when all other entries are exhausted, then the entry without an
expiration date is consumed last.
