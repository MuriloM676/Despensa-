# Database Schema

This document describes the database model. The source of truth is
`packages/database/prisma/schema.prisma`.

## Entities

### User

Account used to sign in. Also includes the Auth.js adapter tables
(`Account`, `Session`, `VerificationToken`).

### Household

The shared unit that owns products, inventory and shopping lists.

### HouseholdMember

Link between a user and a household, with a role (`OWNER` | `MEMBER`).

### ProductCategory

Optional grouping for products (e.g. Laticínios, Hortifruti).

### Product

An item *type* belonging to a household (name, brand, unit, category).

### InventoryItem

A concrete *stock entry*: product + household + quantity + purchase date +
optional expiration date + optional consumption timestamp.

### ShoppingList / ShoppingListItem

Lists of items to buy. An item may be linked to a product or be a free-form
name.

## Key relationships

```
User 1—* HouseholdMember *—1 Household 1—* Product
Household 1—* InventoryItem *—1 Product
Household 1—* ShoppingList 1—* ShoppingListItem *—? 1 Product
```

## Notes

- `Purchases` and `Notifications` are planned for MVP 2 / MVP 3 and will be
  added through migrations.
- Inventory consumption is FEFO (see `docs/specs/inventory.md`): the service
  layer decides which entries to reduce.
