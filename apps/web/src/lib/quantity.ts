/**
 * Fractional quantity helpers (B12). Prisma returns `Decimal` objects for
 * `Decimal(10,3)` columns; the UI works with plain numbers formatted pt-BR.
 */

export function quantityToNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

export function formatQuantity(value: unknown): string {
  return quantityToNumber(value).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}
