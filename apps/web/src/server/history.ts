import { prisma } from "@despensa/database";
import type { StockEventKind } from "@/lib/validations/history";

/**
 * MVP 2 stock history (`docs/specs/stock-history.md`). Events are written by
 * the inventory service inside the same transaction as the stock movement
 * (BR-001); this module only reads.
 */

export interface StockEventRecord {
  id: string;
  householdId: string;
  productId: string;
  kind: StockEventKind;
  quantity: number;
  note: string | null;
  createdAt: Date;
}

export interface ListStockEventsOptions {
  productId?: string;
  limit?: number;
}

export async function listStockEvents(
  householdId: string,
  options: ListStockEventsOptions = {},
): Promise<StockEventRecord[]> {
  const { productId, limit = 50 } = options;
  const rows = await prisma.stockEvent.findMany({
    where: {
      householdId,
      ...(productId ? { productId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  // Prisma returns `Decimal` objects for `Decimal(10,3)` columns; the domain
  // works with plain numbers, so convert at the boundary.
  return rows.map((row) => ({
    ...row,
    quantity: typeof row.quantity === "number" ? row.quantity : Number(row.quantity),
  }));
}
