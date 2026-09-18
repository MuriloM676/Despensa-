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

**FR-009** The user must be able to convert a purchased (done) shopping-list
item into an inventory entry (product, quantity, optional expiration date),
following the simple manual flow (human decision option 1, card desp-vision).

## Business Rules

**BR-001** A shopping list belongs to exactly one household.

**BR-002** Item quantity must be greater than zero.

**BR-003** Item name is required when the item is not linked to a product.

**BR-004** Only members of the household can access its lists.

**BR-005** An item may carry both a product link and a custom name; the name
is stored as given and never silently discarded.

**BR-006** Only items marked done (purchased) can be converted into stock.
Converting a pending item is rejected.

**BR-007** Conversion resolves the product as follows: when the item links to
an existing product, that product is reused; otherwise a product is created
from the item name (unit defaults to `un`), reusing an existing
same-household product with the same name when one exists.

**BR-008** Conversion creates exactly one inventory entry with the item
quantity and the optional expiration date given at conversion time. Purchase
date defaults to the current date. The shopping-list item itself is kept
(unchanged, still done); items are never merged.

## Purchase-to-stock flow (simple manual version)

1. The user marks a shopping-list item as done (purchased).
2. Next to each done item, the UI offers "Move to stock" with an optional
   expiration date field.
3. On submit, the server validates the item (exists, belongs to the user's
   household, is done), resolves the product per BR-007, and creates the
   inventory entry per BR-008.
4. The user sees the new entry in the inventory; the list item stays done.

## Acceptance Criteria

**AC-001** Given a user in a household, when the user creates a list named
"Feira", then the list is visible in the household's list of lists.

**AC-002** Given a list with an item of quantity 1, when the user tries to add
the same item again with quantity 1, then a new item is created (items are not
merged in MVP 1).

**AC-003** Given an item linked to a product, when the list is displayed, then
the product name is shown.

**AC-004** Given a done item linked to a product with quantity 2, when the
user converts it into stock, then one inventory entry of quantity 2 is created
for that product and the list item stays done.

**AC-005** Given a done item with only a custom name, when the user converts
it into stock, then a product with that name is created (or reused when it
already exists) and one inventory entry is created for it.

**AC-006** Given a pending (not done) item, when the user tries to convert it
into stock, then the operation is rejected with an error.

## Out of scope (later)

- Converting purchased items into stock entries automatically.
- Bulk conversion of a whole list at once.
- Sorting by category in the store.
- Sharing lists across households.
