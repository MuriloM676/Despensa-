# Roadmap

## MVP 1 (current)

Scope:

- Authentication (email + password).
- Household.
- Products and categories.
- Inventory with expiration dates and FEFO consumption.
- Shopping lists.

Done when:

- A user can sign in, register a product, add a stock entry with an expiration
  date, consume stock (FEFO) and manage a shopping list.
- All MVP 1 features have tests.
- `pnpm build`, `pnpm test`, `pnpm lint` and `pnpm typecheck` pass.

## MVP 2

- Dashboard with expiration and low-stock alerts.
- Minimum stock levels per product.
- Replenishment suggestions.
- Purchase and consumption history.

## MVP 3

- PWA.
- Notifications (push / scheduled).
- Household sharing and member management.
- Barcode scanner.

## V2 (AI phase)

- Consumption forecast.
- Shopping suggestions.
- Recipe suggestions.
- Waste detection.
- Habit analysis.

## Infrastructure milestones

- MVP 1: web + postgres + redis in Docker Compose.
- MVP 2: background worker + scheduler for notifications and forecasts.
