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

  const available = sorted.reduce((sum, e) => sum + e.quantity, 0);
  if (available < quantity) {
    throw new InsufficientStockError(available, quantity);
  }

  const plan: FefoConsumptionPlan[] = [];
  let remaining = quantity;

  for (const entry of sorted) {
    if (remaining <= 0) break;
    const amount = Math.min(entry.quantity, remaining);
    plan.push({ itemId: entry.id, amount });
    remaining -= amount;
  }

  return plan;
}
