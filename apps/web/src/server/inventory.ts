import { prisma } from "@despensa/database";
import type { AddInventoryItemInput, ConsumeInventoryInput } from "@/lib/validations/inventory";
import { planFefoConsumption, InsufficientStockError } from "./fefo";

/**
 * How many times a consume is attempted before giving up. Retries only
 * happen on transient serialization conflicts (P2034 / SQLSTATE 40001);
 * any other error (including insufficient stock) throws immediately.
 */
const CONSUME_MAX_ATTEMPTS = 3;

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

  return prisma.inventoryItem.create({
    data: {
      householdId,
      productId: input.productId,
      quantity: input.quantity,
      purchaseDate: input.purchaseDate ?? new Date(),
      expirationDate: input.expirationDate ?? null,
    },
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

          const plan = planFefoConsumption(entries, input.quantity);
          const quantityById = new Map(entries.map((entry) => [entry.id, entry.quantity]));

          await Promise.all(
            plan.map((step) =>
              quantityById.get(step.itemId) === step.amount
                ? tx.inventoryItem.delete({ where: { id: step.itemId } })
                : tx.inventoryItem.update({
                    where: { id: step.itemId },
                    data: {
                      quantity: { decrement: step.amount },
                    },
                  }),
            ),
          );

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
  const result = await prisma.inventoryItem.deleteMany({
    where: { id: itemId, householdId },
  });
  if (result.count === 0) {
    throw new Error("Item não encontrado");
  }
}

export { InsufficientStockError };

export function countStockedProducts(items: { productId: string }[]): number {
  return new Set(items.map((item) => item.productId)).size;
}
