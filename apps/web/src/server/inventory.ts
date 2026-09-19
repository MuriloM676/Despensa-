import { prisma } from "@despensa/database";
import type { AddInventoryItemInput, ConsumeInventoryInput } from "@/lib/validations/inventory";
import { planFefoConsumption, InsufficientStockError } from "./fefo";

/**
 * How many times a consume is attempted before giving up. Retries only
 * happen on transient serialization conflicts (P2034 / SQLSTATE 40001);
 * any other error (including insufficient stock) throws immediately.
 */
const CONSUME_MAX_ATTEMPTS = 3;

/**
 * Prisma returns `Decimal` objects for `Decimal(10,3)` columns (B12);
 * the domain works with plain numbers, so convert at the boundary.
 */
function quantityToNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function isSerializationConflict(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    if ((error as { code: unknown }).code === "P2034") {
      return true;
    }
  }
  const message = error instanceof Error ? error.message : "";
  return message.includes("could not serialize") || message.includes("40001");
}

export function listInventory(householdId: string) {
  return prisma.inventoryItem.findMany({
    where: {
      householdId,
      consumedAt: null,
      quantity: { gt: 0 },
    },
    include: {
      product: { include: { category: true } },
    },
    orderBy: [
      { product: { name: "asc" } },
      { expirationDate: { sort: "asc", nulls: "last" } },
    ],
  });
}

export async function addInventoryItem(householdId: string, input: AddInventoryItemInput) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, householdId },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  // Stock history (BR-001 of `stock-history.md`): the PURCHASE event is
  // written in the same transaction as the stock entry.
  return prisma.$transaction(async (tx) => {
    const entry = await tx.inventoryItem.create({
      data: {
        householdId,
        productId: input.productId,
        quantity: input.quantity,
        purchaseDate: input.purchaseDate ?? new Date(),
        expirationDate: input.expirationDate ?? null,
      },
    });
    await tx.stockEvent.create({
      data: {
        householdId,
        productId: input.productId,
        kind: "PURCHASE",
        quantity: input.quantity,
      },
    });
    return entry;
  });
}

export async function consumeInventory(householdId: string, input: ConsumeInventoryInput) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // B9: lock this product's stock rows before reading, so two
          // concurrent consumes serialize instead of both planning from
          // the same snapshot (which would oversell).
          await tx.$executeRaw`SELECT id FROM "InventoryItem" WHERE "householdId" = ${householdId} AND "productId" = ${input.productId} AND "consumedAt" IS NULL AND "quantity" > 0 FOR UPDATE`;

          const entries = await tx.inventoryItem.findMany({
            where: {
              householdId,
              productId: input.productId,
              consumedAt: null,
              quantity: { gt: 0 },
            },
            orderBy: { expirationDate: { sort: "asc", nulls: "last" } },
          });

          // B12: normalize Prisma Decimals to numbers; compare in integer
          // thousandths so a fully-consumed fractional lot is deleted
          // (exact) instead of decremented to dust.
          const normalized = entries.map((entry) => ({
            id: entry.id,
            quantity: quantityToNumber(entry.quantity),
            expirationDate: entry.expirationDate,
          }));
          const plan = planFefoConsumption(normalized, input.quantity);
          const millisById = new Map(
            normalized.map((entry) => [entry.id, Math.round(entry.quantity * 1000)]),
          );

          await Promise.all(
            plan.map((step) =>
              millisById.get(step.itemId) === Math.round(step.amount * 1000)
                ? tx.inventoryItem.delete({ where: { id: step.itemId } })
                : tx.inventoryItem.update({
                    where: { id: step.itemId },
                    data: {
                      quantity: { decrement: step.amount },
                    },
                  }),
            ),
          );

          // Stock history (BR-004 of `stock-history.md`): one CONSUME event
          // per consumption call with the aggregate quantity. Inside the
          // same transaction, so a failed consume leaves no event.
          await tx.stockEvent.create({
            data: {
              householdId,
              productId: input.productId,
              kind: "CONSUME",
              quantity: input.quantity,
            },
          });

          return plan;
        },
        { isolationLevel: "Serializable", maxWait: 5000, timeout: 15000 },
      );
    } catch (error) {
      if (attempt >= CONSUME_MAX_ATTEMPTS || !isSerializationConflict(error)) {
        throw error;
      }
    }
  }
}

export async function removeInventoryItem(householdId: string, itemId: string) {
  // Stock history (BR-001 of `stock-history.md`): the REMOVE event is
  // written in the same transaction as the deletion.
  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({
      where: { id: itemId, householdId },
    });
    if (!item) {
      throw new Error("Item não encontrado");
    }
    await tx.inventoryItem.delete({ where: { id: item.id } });
    await tx.stockEvent.create({
      data: {
        householdId,
        productId: item.productId,
        kind: "REMOVE",
        quantity: quantityToNumber(item.quantity),
      },
    });
  });
}

export { InsufficientStockError };

export function countStockedProducts(items: { productId: string }[]): number {
  return new Set(items.map((item) => item.productId)).size;
}
