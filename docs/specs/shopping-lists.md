# Spec: Shopping Lists

## Status

Accepted (MVP 1)

## Objective

Allow household members to plan purchases using shopping lists with items and
quantities.

## User story

As a household member,
I want to create shopping lists and add items to them,
so that I can plan what to buy for my household.

## Functional Requirements

**FR-001** The user must be able to create a shopping list in their household.

**FR-002** The user must be able to rename a shopping list.

**FR-003** The user must be able to delete a shopping list.

**FR-004** The user must be able to add an item to a shopping list, with a name
and a quantity.

**FR-005** The user may link an item to an existing product in the household.

**FR-006** The user must be able to mark an item as done (checked off).

**FR-007** The user must be able to view all lists of their household.

**FR-008** The user must be able to view the details of a single list.

## Business Rules

**BR-001** A shopping list belongs to exactly one household.

**BR-002** Item quantity must be greater than zero.

**BR-003** Item name is required when the item is not linked to a product.

**BR-004** Only members of the household can access its lists.

**BR-005** An item may carry both a product link and a custom name; the name
is stored as given and never silently discarded.

## Acceptance Criteria

**AC-001** Given a user in a household, when the user creates a list named
"Feira", then the list is visible in the household's list of lists.

**AC-002** Given a list with an item of quantity 1, when the user tries to add
the same item again with quantity 1, then a new item is created (items are not
merged in MVP 1).

**AC-003** Given an item linked to a product, when the list is displayed, then
the product name is shown.

## Out of scope (later)

- Converting purchased items into stock entries automatically.
- Sorting by category in the store.
- Sharing lists across households.
