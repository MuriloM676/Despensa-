import { prisma } from "@despensa/database";

/**
 * MVP 2 low-stock and replenishment suggestions (`docs/specs/replenishment.md`).
 *
 * The pure helpers (`sumStockByProduct`, `findLowStock`) work on plain data
 * so they are unit-testable without a database. `getReplenishmentSuggestions`
 * is the db-backed composition used by the dashboard and inventory pages.
 */

export interface StockTotal {
  productId: string;
  total: number;
}

export interface LowStockItem {
  productId: string;
  stock: number;
  minStock: number;
  suggested: number;
}

export interface ReplenishmentSuggestion {
  productId: string;
  name: string;
  brand: string | null;
  unit: string;
  stock: number;
  minStock: number;
  suggested: number;
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Sums available stock per product. Callers pass the already-filtered
 * available entries (quantity gt 0, not consumed).
 */
export function sumStockByProduct(
  items: { productId: string; quantity: unknown }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.productId, round3((totals.get(item.productId) ?? 0) + toNumber(item.quantity)));
  }
  return totals;
}

/**
 * BR-002/BR-004: a product is low-stock when its minimum is greater than
 * zero and its available stock is strictly below the minimum. Expiration is
 * ignored. Returns one entry per low-stock product with the BR-003 suggested
 * quantity (`minimum - stock`, always positive here).
 */
export function findLowStock(
  products: { id: string; minStockLevel: unknown }[],
  totals: Map<string, number>,
): LowStockItem[] {
  const result: LowStockItem[] = [];
  for (const product of products) {
    const minStock = toNumber(product.minStockLevel);
    if (!(minStock > 0)) {
      continue;
    }
    const stock = totals.get(product.id) ?? 0;
    if (stock < minStock) {
      result.push({
        productId: product.id,
        stock,
        minStock,
        suggested: round3(minStock - stock),
      });
    }
  }
  return result;
}

export async function getReplenishmentSuggestions(
  householdId: string,
): Promise<ReplenishmentSuggestion[]> {
  const [products, items] = await Promise.all([
    prisma.product.findMany({ where: { householdId } }),
    prisma.inventoryItem.findMany({
      where: { householdId, consumedAt: null, quantity: { gt: 0 } },
      select: { productId: true, quantity: true },
    }),
  ]);

  const totals = sumStockByProduct(items);
  const lowStock = findLowStock(products, totals);
  const byId = new Map(products.map((product) => [product.id, product]));

  return lowStock
    .map((entry) => {
      const product = byId.get(entry.productId);
      if (!product) {
        return null;
      }
      return {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        unit: product.unit,
        stock: entry.stock,
        minStock: entry.minStock,
        suggested: entry.suggested,
      };
    })
    .filter((entry): entry is ReplenishmentSuggestion => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
