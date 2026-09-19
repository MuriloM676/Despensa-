import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@despensa/database", async () => {
  const { createInMemoryPrisma } = await import("./in-memory-prisma");
  const db = createInMemoryPrisma();
  globalThis.__despensaTestDb = db;
  return { prisma: db.prisma };
});

import { getTestDb } from "./in-memory-prisma";
import {
  addShoppingListItem,
  createShoppingList,
  toggleShoppingListItem,
} from "./shopping-list";
import { createProduct } from "./product";
import { purchaseToStock } from "./purchase-to-stock";
import { listInventory } from "./inventory";

const HOUSEHOLD = "household-1";

beforeEach(() => {
  getTestDb().reset();
});

async function doneItem(options: {
  name?: string;
  productId?: string;
  quantity?: number;
}): Promise<{ listId: string; itemId: string }> {
  const list = await createShoppingList(HOUSEHOLD, { name: "Feira" });
  const item = await addShoppingListItem(HOUSEHOLD, {
    listId: list.id,
    quantity: options.quantity ?? 3,
    name: options.name ?? "",
    productId: options.productId ?? "",
  });
  await toggleShoppingListItem(HOUSEHOLD, item.id, true);
  return { listId: list.id, itemId: item.id };
}

describe("purchase-to-stock integration (B11, FR-009)", () => {
  it("launches a linked product into stock without creating a product", async () => {
    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "",
    });
    const { listId, itemId } = await doneItem({ productId: product.id, quantity: 2 });

    const result = await purchaseToStock(HOUSEHOLD, {
      itemId,
      listId,
      expirationDate: undefined,
    });

    expect(result).toMatchObject({ productId: product.id, createdProduct: false });
    expect(result.inventoryItemId).toBeTruthy();
    const stock = (await listInventory(HOUSEHOLD)) as unknown as Array<{
      productId: string;
      quantity: number;
    }>;
    expect(stock).toHaveLength(1);
    expect(stock[0]).toMatchObject({ productId: product.id, quantity: 2 });
  });

  it("creates the product from the item name when unlinked (BR-007)", async () => {
    const { listId, itemId } = await doneItem({ name: "Tapioca" });

    const result = await purchaseToStock(HOUSEHOLD, {
      itemId,
      listId,
      expirationDate: undefined,
    });

    expect(result.createdProduct).toBe(true);
    const products = [...getTestDb().products.values()];
    expect(products).toHaveLength(1);
    expect(products[0]?.name).toBe("Tapioca");
    expect(result.productId).toBe(products[0]?.id);
  });

  it("reuses an existing product with the same name instead of duplicating", async () => {
    const product = await createProduct(HOUSEHOLD, {
      name: "Tapioca",
      brand: "",
      unit: "un",
      categoryId: "",
    });
    const { listId, itemId } = await doneItem({ name: "Tapioca" });

    const result = await purchaseToStock(HOUSEHOLD, {
      itemId,
      listId,
      expirationDate: undefined,
    });

    expect(result).toMatchObject({ productId: product.id, createdProduct: false });
    expect(getTestDb().products.size).toBe(1);
  });

  it("carries the expiration date into the stock entry", async () => {
    const product = await createProduct(HOUSEHOLD, {
      name: "Iogurte",
      brand: "",
      unit: "un",
      categoryId: "",
    });
    const { listId, itemId } = await doneItem({ productId: product.id });

    const expected = new Date("2026-10-01T00:00:00");
    const result = await purchaseToStock(HOUSEHOLD, {
      itemId,
      listId,
      expirationDate: expected,
    });

    const entry = getTestDb().inventory.get(result.inventoryItemId);
    expect(entry?.expirationDate?.getTime()).toBe(expected.getTime());
  });

  it("carries a fractional quantity into the stock entry (AC-007)", async () => {
    const product = await createProduct(HOUSEHOLD, {
      name: "Farinha",
      brand: "",
      unit: "kg",
      categoryId: "",
    });
    const { listId, itemId } = await doneItem({ productId: product.id, quantity: 0.5 });

    const result = await purchaseToStock(HOUSEHOLD, {
      itemId,
      listId,
      expirationDate: undefined,
    });

    expect(result).toMatchObject({ productId: product.id, createdProduct: false });
    const stock = (await listInventory(HOUSEHOLD)) as unknown as Array<{
      productId: string;
      quantity: number;
    }>;
    expect(stock).toHaveLength(1);
    expect(stock[0]?.quantity).toBeCloseTo(0.5, 6);
  });

  it("rejects pending items (BR-006)", async () => {
    const list = await createShoppingList(HOUSEHOLD, { name: "Feira" });
    const item = await addShoppingListItem(HOUSEHOLD, {
      listId: list.id,
      quantity: 1,
      name: "Pendente",
      productId: "",
    });

    await expect(
      purchaseToStock(HOUSEHOLD, { itemId: item.id, listId: list.id, expirationDate: undefined }),
    ).rejects.toThrow("Marque o item como comprado antes de lançar no estoque");
    expect(getTestDb().inventory.size).toBe(0);
  });

  it("rejects unknown items and items from another household", async () => {
    const { itemId } = await doneItem({ name: "Tapioca" });
    const lists = [...getTestDb().lists.values()];
    const listId = lists[0]?.id ?? "missing";

    await expect(
      purchaseToStock(HOUSEHOLD, {
        itemId: "missing",
        listId,
        expirationDate: undefined,
      }),
    ).rejects.toThrow("Item não encontrado");
    await expect(
      purchaseToStock("household-2", { itemId, listId, expirationDate: undefined }),
    ).rejects.toThrow("Item não encontrado");
  });

  it("rejects a linked product from another household", async () => {
    const foreign = await createProduct("household-2", {
      name: "Alheio",
      brand: "",
      unit: "un",
      categoryId: "",
    });
    const db = getTestDb();
    const list = await db.prisma.shoppingList.create({
      data: { householdId: HOUSEHOLD, name: "Feira" },
    });
    const raw = await db.prisma.shoppingListItem.create({
      data: { listId: list.id, productId: foreign.id, name: null, quantity: 1 },
    });
    await db.prisma.shoppingListItem.update({ where: { id: raw.id }, data: { done: true } });

    await expect(
      purchaseToStock(HOUSEHOLD, {
        itemId: raw.id,
        listId: list.id,
        expirationDate: undefined,
      }),
    ).rejects.toThrow("Produto não encontrado");
  });
});
