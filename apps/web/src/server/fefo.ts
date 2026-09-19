/**
 * FEFO consumption planner. Quantities are decimal (up to 3 places, B12), so
 * planning runs on integer thousandths (`Math.round(q * 1000)`) to avoid
 * binary floating-point dust (e.g. `0.6 - 0.2 - 0.2 !== 0.2` in floats).
 * Plan amounts are converted back to 3dp numbers for Prisma `Decimal` writes.
 */
export class InsufficientStockError extends Error {
  constructor(available: number, requested: number) {
    super(`Insufficient stock: requested ${requested}, available ${available}`);
  }
}

export interface FefoEntry {
  id: string;
  quantity: number;
  expirationDate: Date | null;
}

export interface FefoConsumptionPlan {
  itemId: string;
  amount: number;
}

export function planFefoConsumption(
  entries: FefoEntry[],
  quantity: number,
): FefoConsumptionPlan[] {
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.expirationDate === null && b.expirationDate === null) return 0;
    if (a.expirationDate === null) return 1;
    if (b.expirationDate === null) return -1;
    return a.expirationDate.getTime() - b.expirationDate.getTime();
  });

  const toMillis = (q: number): number => Math.round(q * 1000);
  const requestedMillis = toMillis(quantity);
  const availableMillis = sorted.reduce((sum, e) => sum + toMillis(e.quantity), 0);
  if (availableMillis < requestedMillis) {
    throw new InsufficientStockError(availableMillis / 1000, quantity);
  }

  const plan: FefoConsumptionPlan[] = [];
  let remainingMillis = requestedMillis;

  for (const entry of sorted) {
    if (remainingMillis <= 0) break;
    const amountMillis = Math.min(toMillis(entry.quantity), remainingMillis);
    plan.push({ itemId: entry.id, amount: amountMillis / 1000 });
    remainingMillis -= amountMillis;
  }

  return plan;
}
