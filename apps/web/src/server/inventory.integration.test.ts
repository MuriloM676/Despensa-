import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@despensa/database", async () => {
  const { createInMemoryPrisma } = await import("./in-memory-prisma");
  const db = createInMemoryPrisma();
  globalThis.__despensaTestDb = db;
  return { prisma: db.prisma };
});

import { getTestDb } from "./in-memory-prisma";
import {
  addInventoryItem,
  consumeInventory,
  countStockedProducts,
  listInventory,
  removeInventoryItem,
  InsufficientStockError,
} from "./inventory";

const HOUSEHOLD = "household-1";

beforeEach(() => {
  getTestDb().reset();
});

async function seedProduct(name = "Arroz"): Promise<string> {
  const product = await getTestDb().prisma.product.create({
    data: { householdId: HOUSEHOLD, name, brand: null, unit: "kg", categoryId: null },
  });
  return product.id;
}

interface ListedItem {
  id: string;
  quantity: number;
  expirationDate: Date | null;
  product: { name: string; category: { name: string } | null };
}

async function stocked(): Promise<ListedItem[]> {
  return (await listInventory(HOUSEHOLD)) as unknown as ListedItem[];
}

describe("inventory integration (B11, in-memory Prisma)", () => {
  it("adds stock for a household product and lists it with category", async () => {
    const db = getTestDb();
    const category = await db.prisma.productCategory.create({
      data: { householdId: HOUSEHOLD, name: "Grãos" },
    });
    const product = await db.prisma.product.create({
      data: {
        householdId: HOUSEHOLD,
        name: "Arroz",
        brand: null,
        unit: "kg",
        categoryId: category.id,
      },
    });

    const item = await addInventoryItem(HOUSEHOLD, {
      productId: product.id,
      quantity: 2,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    expect(item).toMatchObject({ productId: product.id, quantity: 2, expirationDate: null });

    const listed = await stocked();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.product.name).toBe("Arroz");
    expect(listed[0]?.product.category?.name).toBe("Grãos");
  });

  it("rejects stock for a product from another household", async () => {
    const productId = await seedProduct();
    await expect(
      addInventoryItem("household-2", {
        productId,
        quantity: 1,
        purchaseDate: undefined,
        expirationDate: undefined,
      }),
    ).rejects.toThrow("Produto não encontrado");
  });

  it("consumes FEFO across lots: earliest expiration first", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 2,
      purchaseDate: undefined,
      expirationDate: new Date("2026-09-20T00:00:00"),
    });
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 5,
      purchaseDate: undefined,
      expirationDate: new Date("2026-08-10T00:00:00"),
    });

    const plan = await consumeInventory(HOUSEHOLD, { productId, quantity: 3 });

    expect(plan).toHaveLength(1);
    expect(plan[0]?.amount).toBe(3);
    const remaining = await stocked();
    expect(remaining).toHaveLength(2);
    const august = remaining.find(
      (r) => r.expirationDate?.getTime() === new Date("2026-08-10T00:00:00").getTime(),
    );
    expect(august?.quantity).toBe(2);
  });

  it("consumes lots without expiration last (NULLS LAST, B10)", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 4,
      purchaseDate: undefined,
      expirationDate: undefined,
    });
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 4,
      purchaseDate: undefined,
      expirationDate: new Date("2026-08-10T00:00:00"),
    });

    await consumeInventory(HOUSEHOLD, { productId, quantity: 4 });

    const remaining = await stocked();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.expirationDate).toBeNull();
    expect(remaining[0]?.quantity).toBe(4);
  });

  it("deletes fully-consumed lines so listInventory hides them (B2)", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 2,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    await consumeInventory(HOUSEHOLD, { productId, quantity: 2 });

    expect(await listInventory(HOUSEHOLD)).toHaveLength(0);
    expect(getTestDb().inventory.size).toBe(0);
  });

  it("throws InsufficientStockError without touching stock", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 1,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    await expect(
      consumeInventory(HOUSEHOLD, { productId, quantity: 5 }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
    const remaining = await stocked();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.quantity).toBe(1);
  });

  it("ignores stock from other households when consuming", async () => {
    const db = getTestDb();
    const other = await db.prisma.product.create({
      data: {
        householdId: "household-2",
        name: "Arroz",
        brand: null,
        unit: "kg",
        categoryId: null,
      },
    });
    await db.prisma.inventoryItem.create({
      data: {
        householdId: "household-2",
        productId: other.id,
        quantity: 10,
        purchaseDate: new Date(),
        expirationDate: null,
      },
    });
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 1,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    await expect(
      consumeInventory(HOUSEHOLD, { productId, quantity: 2 }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it("removes an item and rejects unknown ids", async () => {
    const productId = await seedProduct();
    const item = await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 1,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    await removeInventoryItem(HOUSEHOLD, item.id);
    expect(await listInventory(HOUSEHOLD)).toHaveLength(0);
    await expect(removeInventoryItem(HOUSEHOLD, item.id)).rejects.toThrow(
      "Item não encontrado",
    );
  });

  it("serializes concurrent consumes so stock never goes negative (AC-008, B9)", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 3,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    const results = await Promise.allSettled([
      consumeInventory(HOUSEHOLD, { productId, quantity: 2 }),
      consumeInventory(HOUSEHOLD, { productId, quantity: 2 }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const loser = rejected[0];
    if (!loser || loser.status !== "rejected") {
      throw new Error("expected one consume to be rejected");
    }
    expect(loser.reason).toBeInstanceOf(InsufficientStockError);

    const remaining = await stocked();
    const total = remaining.reduce((sum, r) => sum + r.quantity, 0);
    expect(total).toBe(1);
  });

  it("counts distinct stocked products for the dashboard (B13)", () => {
    expect(
      countStockedProducts([
        { productId: "rice" },
        { productId: "rice" },
        { productId: "milk" },
      ]),
    ).toBe(2);
    expect(countStockedProducts([])).toBe(0);
  });
});
