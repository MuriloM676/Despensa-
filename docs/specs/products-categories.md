# Spec: Products & Categories

## Status

Accepted (MVP 1)

## Objective

Allow household members to maintain a catalog of products and categories that
other features (inventory, shopping lists) reference.

## User story

As a household member,
I want to register products with a name, optional brand, unit and category,
so that inventory entries and shopping list items can reference them.

## Concepts

### Product

A product represents an item type. It belongs to exactly one household.

Example: Milk (brand: Parmalat, unit: L, category: Dairy).

### ProductCategory

A category groups products within a household (e.g. Dairy, Pantry, Cleaning).
It belongs to exactly one household.

## Functional Requirements

**FR-001** The user must be able to create a product in their household with a
name, an optional brand, a unit and an optional category.

**FR-002** The user must be able to view all products of their household, with
their category when set.

**FR-003** The user must be able to delete a product of their household.

**FR-004** The user must be able to view all categories of their household.

## Business Rules

**BR-001** A product belongs to exactly one household. Only members of the
household can access its products and categories.

**BR-002** Product name is required, trimmed, 1–120 characters.

**BR-003** Product uniqueness: within a household, the tuple
`(name, brand)` is unique. A duplicate name with the same brand (including
both without a brand) is rejected with an error. The comparison is exact
(case-sensitive) on the trimmed values; `NULL` and empty brands are treated
as the same (no brand).

**BR-004** Brand is optional, trimmed, at most 120 characters. An empty brand
is stored as `NULL` (no brand).

**BR-005** Unit is required, trimmed, 1–20 characters. When omitted it
defaults to `"un"`. An explicitly empty unit is rejected.

**BR-006** Category is optional. When given, the category must exist and
belong to the same household; otherwise creation is rejected. Deleting a
category keeps its products; their category link is cleared (`SET NULL`).

**BR-007** Category uniqueness: within a household, the category name is
unique (exact match on the trimmed value).

**BR-008** Deleting a product keeps history intact: inventory items of the
product are deleted with it (`CASCADE`), while shopping list items keep their
row and lose the product link (`SET NULL`, custom name preserved).

## Acceptance Criteria

**AC-001** Given a household with product "Milk" (no brand), when the user
creates another product named "Milk" without a brand, then the operation is
rejected with a duplicate error.

**AC-002** Given a household with product "Milk" (brand "A"), when the user
creates product "Milk" with brand "B", then a second product is created.

**AC-003** Given a product create without a unit, when it is saved, then the
unit is `"un"`.

**AC-004** Given categories of another household, when the user creates a
product referencing one of them, then the operation is rejected.

## Out of scope (later)

- Minimum stock levels per product (MVP 2).
- Barcode lookup.
- Sharing products across households.
