import { prisma } from "@despensa/database";
import type { AddInventoryItemInput, ConsumeInventoryInput } from "@/lib/validations/inventory";
import { planFefoConsumption, InsufficientStockError } from "./fefo";

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
  const entries = await prisma.inventoryItem.findMany({
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

  await prisma.$transaction(
    plan.map((step) =>
      quantityById.get(step.itemId) === step.amount
        ? prisma.inventoryItem.delete({ where: { id: step.itemId } })
        : prisma.inventoryItem.update({
            where: { id: step.itemId },
            data: {
              quantity: { decrement: step.amount },
            },
          }),
    ),
  );

  return plan;
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
