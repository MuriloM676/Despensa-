# Vision

## The problem

Households waste food and money because they lose track of what they have
bought, when it expires and what they actually need. Shopping lists are
disconnected from real inventory, so people buy duplicates and let items spoil
in the pantry.

## The product

Despensa+ is a web application for smart household inventory and shopping
management.

The central concept: **you register what you bought, and the system takes care
of the stock, the expiration dates and the next purchase.**

## Core value loop

```
Shopping list → Register purchase → Stock updated → Expiration / low stock /
consumption forecasts → Suggestions → Next shopping list
```

The system connects purchases to inventory to future needs. This is what
differentiates it from a plain to-do list of groceries.

## Primary capabilities

- Shopping lists
- Household inventory
- Expiration date tracking
- Expiration alerts
- Minimum stock levels
- Replenishment suggestions
- Consumption forecast
- Items about to spoil
- Purchase / consumption history
- Household sharing
- PWA
- AI assistance (future)

## Design principles

- **Product ≠ Stock.** A product is a type (Milk). Stock is a set of concrete
  entries with quantity and expiration date (2x Milk, expires 05/08).
- **FEFO by default.** When consuming, expire-first items are consumed first.
- **Automatic, not manual.** Expiration status, low-stock and suggestions are
  computed by the system, not typed by the user.
- **Mobile-friendly.** PWA from MVP 3 onward.

## What we are not building (yet)

- Nutrition tracking
- Recipe search by ingredients (AI phase)
- Supply chain / barcode catalog integration (barcode scanning is MVP 3)
