import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@despensa/database", async () => {
  const { createInMemoryPrisma } = await import("./in-memory-prisma");
  const db = createInMemoryPrisma();
  globalThis.__despensaTestDb = db;
  return { prisma: db.prisma };
});

import { getTestDb } from "./in-memory-prisma";
import { addInventoryItem, consumeInventory, removeInventoryItem } from "./inventory";
import { createProduct, updateProduct } from "./product";
import { listStockEvents } from "./history";
import { getReplenishmentSuggestions } from "./stock-alerts";
import { updateAlertWindowDays } from "./household";

const HOUSEHOLD = "household-1";

beforeEach(() => {
  getTestDb().reset();
});

async function seedProduct(name = "Arroz", minStockLevel = 0): Promise<string> {
  const product = await createProduct(HOUSEHOLD, {
    name,
    brand: "",
    unit: "kg",
    categoryId: "",
    minStockLevel,
  });
  return product.id;
}

describe("stock history integration (MVP2, in-memory Prisma)", () => {
  it("records a PURCHASE event when stock is added (AC-001)", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 2,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    const events = await listStockEvents(HOUSEHOLD);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ productId, kind: "PURCHASE", quantity: 2 });
  });

  it("records one CONSUME event with the aggregate quantity (AC-002)", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 1,
      purchaseDate: undefined,
      expirationDate: new Date("2026-08-10T00:00:00"),
    });
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 2,
      purchaseDate: undefined,
      expirationDate: new Date("2026-08-20T00:00:00"),
    });

    await consumeInventory(HOUSEHOLD, { productId, quantity: 1.5 });

    const consumes = (await listStockEvents(HOUSEHOLD)).filter(
      (event) => event.kind === "CONSUME",
    );
    expect(consumes).toHaveLength(1);
    expect(consumes[0]).toMatchObject({ productId, quantity: 1.5 });
  });

  it("records no CONSUME event when consumption fails (AC-003)", async () => {
    const productId = await seedProduct();
    await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 1,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    await expect(
      consumeInventory(HOUSEHOLD, { productId, quantity: 2 }),
    ).rejects.toThrow();

    const consumes = (await listStockEvents(HOUSEHOLD)).filter(
      (event) => event.kind === "CONSUME",
    );
    expect(consumes).toHaveLength(0);
  });

  it("records a REMOVE event when an entry is discarded", async () => {
    const productId = await seedProduct();
    const entry = await addInventoryItem(HOUSEHOLD, {
      productId,
      quantity: 3,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    await removeInventoryItem(HOUSEHOLD, entry.id);

    const removes = (await listStockEvents(HOUSEHOLD)).filter(
      (event) => event.kind === "REMOVE",
    );
    expect(removes).toHaveLength(1);
    expect(removes[0]).toMatchObject({ productId, quantity: 3 });
  });

  it("filters by product, newest first (AC-004)", async () => {
    const db = getTestDb();
    const rice = await seedProduct("Arroz");
    const milk = await seedProduct("Leite");
    for (const productId of [rice, milk, rice]) {
      await addInventoryItem(HOUSEHOLD, {
        productId,
        quantity: 1,
        purchaseDate: undefined,
        expirationDate: undefined,
      });
    }
    // Same-ms creations would tie on createdAt; pin deterministic timestamps.
    const riceEvents = [...db.events.values()].filter((e) => e.productId === rice);
    riceEvents[0]!.createdAt = new Date("2026-08-01T10:00:00Z");
    riceEvents[1]!.createdAt = new Date("2026-08-02T10:00:00Z");

    const filtered = await listStockEvents(HOUSEHOLD, { productId: rice });
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.productId)).toEqual([rice, rice]);
    expect(filtered[0]!.createdAt.getTime()).toBeGreaterThan(
      filtered[1]!.createdAt.getTime(),
    );
  });

  it("suggests replenishment for products below minimum (replenishment AC-001)", async () => {
    const rice = await seedProduct("Arroz", 5);
    await seedProduct("Feijão", 0);
    await addInventoryItem(HOUSEHOLD, {
      productId: rice,
      quantity: 2,
      purchaseDate: undefined,
      expirationDate: undefined,
    });

    const suggestions = await getReplenishmentSuggestions(HOUSEHOLD);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      productId: rice,
      name: "Arroz",
      stock: 2,
      minStock: 5,
      suggested: 3,
    });
  });

  it("persists the minimum stock level on create and update", async () => {
    const productId = await seedProduct("Café", 1.5);
    const products = await getTestDb().prisma.product.findMany({
      where: { householdId: HOUSEHOLD },
    });
    expect(products.find((p) => (p as { id: string }).id === productId)).toMatchObject({
      minStockLevel: 1.5,
    });

    await updateProduct(HOUSEHOLD, productId, {
      productId,
      name: "Café",
      brand: "",
      unit: "kg",
      categoryId: "",
      minStockLevel: 2.5,
    });
    const after = await getTestDb().prisma.product.findMany({
      where: { householdId: HOUSEHOLD },
    });
    expect(after.find((p) => (p as { id: string }).id === productId)).toMatchObject({
      minStockLevel: 2.5,
    });
  });

  it("updates the household alert window", async () => {
    const db = getTestDb();
    const household = await db.prisma.household.create({
      data: { name: "Casa" },
    });
    await updateAlertWindowDays(household.id, 10);
    expect(db.households.get(household.id)?.alertWindowDays).toBe(10);
  });
});
