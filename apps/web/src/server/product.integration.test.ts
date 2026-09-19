import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@despensa/database", async () => {
  const { createInMemoryPrisma } = await import("./in-memory-prisma");
  const db = createInMemoryPrisma();
  globalThis.__despensaTestDb = db;
  return { prisma: db.prisma };
});

import { getTestDb } from "./in-memory-prisma";
import {
  countInventoryEntries,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listCategories,
  listProducts,
  updateProduct,
} from "./product";

const HOUSEHOLD = "household-1";
const OTHER = "household-2";
const DUPLICATE_MESSAGE = "Produto já cadastrado com este nome e marca";

beforeEach(() => {
  getTestDb().reset();
});

describe("product integration (B11, in-memory Prisma)", () => {
  it("creates a product with brand normalized and lists it with category", async () => {
    const db = getTestDb();
    const category = await db.prisma.productCategory.create({
      data: { householdId: HOUSEHOLD, name: "Laticínios" },
    });

    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: category.id, minStockLevel: 0,
    });

    expect(product).toMatchObject({
      householdId: HOUSEHOLD,
      name: "Leite",
      brand: null,
      unit: "L",
      categoryId: category.id, minStockLevel: 0,
    });

    const listed = (await listProducts(HOUSEHOLD)) as unknown as Array<{
      name: string;
      category: { name: string } | null;
    }>;
    expect(listed).toHaveLength(1);
    expect(listed[0]?.category?.name).toBe("Laticínios");
    expect(await listProducts(OTHER)).toHaveLength(0);
  });

  it("rejects duplicates with the same name and brand (app-level)", async () => {
    await createProduct(HOUSEHOLD, {
      name: "Café",
      brand: "Pilão",
      unit: "g",
      categoryId: "", minStockLevel: 0,
    });

    await expect(
      createProduct(HOUSEHOLD, {
        name: "Café",
        brand: "Pilão",
        unit: "g",
        categoryId: "", minStockLevel: 0,
      }),
    ).rejects.toThrow(DUPLICATE_MESSAGE);
  });

  it("rejects duplicates with empty brand (NULL brand, app-level)", async () => {
    await createProduct(HOUSEHOLD, { name: "Açúcar", brand: "", unit: "kg", categoryId: "", minStockLevel: 0 });

    await expect(
      createProduct(HOUSEHOLD, { name: "Açúcar", brand: "", unit: "kg", categoryId: "", minStockLevel: 0 }),
    ).rejects.toThrow(DUPLICATE_MESSAGE);
  });

  it("maps a P2002 race into the friendly duplicate message", async () => {
    getTestDb().failNextProductCreateWithP2002 = true;

    await expect(
      createProduct(HOUSEHOLD, {
        name: "Corrida",
        brand: "Única",
        unit: "un",
        categoryId: "", minStockLevel: 0,
      }),
    ).rejects.toThrow(DUPLICATE_MESSAGE);
  });

  it("allows the same name and brand in another household", async () => {
    await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "Parmalat",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });

    const other = await createProduct(OTHER, {
      name: "Leite",
      brand: "Parmalat",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    expect(other.householdId).toBe(OTHER);
  });

  it("allows the same name with a different brand", async () => {
    await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "A",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    const second = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "B",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    expect(second.brand).toBe("B");
  });

  it("rejects an invalid or foreign category", async () => {
    await expect(
      createProduct(HOUSEHOLD, {
        name: "Leite",
        brand: "",
        unit: "L",
        categoryId: "missing", minStockLevel: 0,
      }),
    ).rejects.toThrow("Categoria inválida");

    const foreign = await getTestDb().prisma.productCategory.create({
      data: { householdId: OTHER, name: "Alheia" },
    });
    await expect(
      createProduct(HOUSEHOLD, {
        name: "Leite",
        brand: "",
        unit: "L",
        categoryId: foreign.id, minStockLevel: 0,
      }),
    ).rejects.toThrow("Categoria inválida");
  });

  it("deletes scoped to the household and lists categories scoped", async () => {
    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    await getTestDb().prisma.productCategory.create({
      data: { householdId: HOUSEHOLD, name: "Bebidas" },
    });
    await getTestDb().prisma.productCategory.create({
      data: { householdId: OTHER, name: "Alheia" },
    });

    const untouched = await deleteProduct(OTHER, product.id);
    expect(untouched).toMatchObject({ count: 0 });
    expect(await listProducts(HOUSEHOLD)).toHaveLength(1);

    const removed = await deleteProduct(HOUSEHOLD, product.id);
    expect(removed).toMatchObject({ count: 1 });
    expect(await listProducts(HOUSEHOLD)).toHaveLength(0);

    const categories = (await listCategories(HOUSEHOLD)) as unknown as Array<{
      name: string;
    }>;
    expect(categories.map((c) => c.name)).toEqual(["Bebidas"]);
  });

  it("updates name, brand, unit and category (FR-005, BR-010)", async () => {
    const db = getTestDb();
    const dairy = await db.prisma.productCategory.create({
      data: { householdId: HOUSEHOLD, name: "Laticínios" },
    });
    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });

    const updated = await updateProduct(HOUSEHOLD, product.id, {
      productId: product.id,
      name: "Café",
      brand: "Pilão",
      unit: "g",
      categoryId: dairy.id, minStockLevel: 0,
    });

    expect(updated).toMatchObject({
      name: "Café",
      brand: "Pilão",
      unit: "g",
      categoryId: dairy.id, minStockLevel: 0,
    });
  });

  it("rejects an update to a duplicate name/brand but allows keeping its own (BR-010)", async () => {
    const first = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "A",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    const second = await createProduct(HOUSEHOLD, {
      name: "Café",
      brand: "",
      unit: "g",
      categoryId: "", minStockLevel: 0,
    });

    await expect(
      updateProduct(HOUSEHOLD, second.id, {
        productId: second.id,
        name: "Leite",
        brand: "A",
        unit: "L",
        categoryId: "", minStockLevel: 0,
      }),
    ).rejects.toThrow(DUPLICATE_MESSAGE);

    const kept = await updateProduct(HOUSEHOLD, first.id, {
      productId: first.id,
      name: "Leite",
      brand: "A",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    expect(kept.id).toBe(first.id);
  });

  it("rejects an update for unknown products or foreign categories", async () => {
    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });

    await expect(
      updateProduct(HOUSEHOLD, "missing", {
        productId: "missing",
        name: "Café",
        brand: "",
        unit: "g",
        categoryId: "", minStockLevel: 0,
      }),
    ).rejects.toThrow("Produto não encontrado");

    await expect(
      updateProduct(OTHER, product.id, {
        productId: product.id,
        name: "Café",
        brand: "",
        unit: "g",
        categoryId: "", minStockLevel: 0,
      }),
    ).rejects.toThrow("Produto não encontrado");

    const foreign = await getTestDb().prisma.productCategory.create({
      data: { householdId: OTHER, name: "Alheia" },
    });
    await expect(
      updateProduct(HOUSEHOLD, product.id, {
        productId: product.id,
        name: "Café",
        brand: "",
        unit: "g",
        categoryId: foreign.id, minStockLevel: 0,
      }),
    ).rejects.toThrow("Categoria inválida");
  });

  it("creates categories with household-scoped uniqueness (FR-006, BR-011)", async () => {
    const category = await createCategory(HOUSEHOLD, { name: "Laticínios" });
    expect(category).toMatchObject({ householdId: HOUSEHOLD, name: "Laticínios" });

    await expect(createCategory(HOUSEHOLD, { name: "Laticínios" })).rejects.toThrow(
      "Categoria já cadastrada",
    );

    const otherHousehold = await createCategory(OTHER, { name: "Laticínios" });
    expect(otherHousehold.householdId).toBe(OTHER);
  });

  it("deletes a category keeping products uncategorized (FR-007, AC-008)", async () => {
    const category = await createCategory(HOUSEHOLD, { name: "Laticínios" });
    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: category.id, minStockLevel: 0,
    });

    const untouched = await deleteCategory(OTHER, category.id);
    expect(untouched).toMatchObject({ count: 0 });
    expect(await listCategories(HOUSEHOLD)).toHaveLength(1);

    const removed = await deleteCategory(HOUSEHOLD, category.id);
    expect(removed).toMatchObject({ count: 1 });
    expect(await listCategories(HOUSEHOLD)).toHaveLength(0);

    const kept = (await listProducts(HOUSEHOLD)) as unknown as Array<{
      id: string;
      category: { name: string } | null;
    }>;
    expect(kept).toHaveLength(1);
    expect(kept[0]?.id).toBe(product.id);
    expect(kept[0]?.category).toBeNull();
  });

  it("counts inventory entries per product for the delete warning (BR-009)", async () => {
    const db = getTestDb();
    const rice = await createProduct(HOUSEHOLD, {
      name: "Arroz",
      brand: "",
      unit: "kg",
      categoryId: "", minStockLevel: 0,
    });
    const milk = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    for (let i = 0; i < 2; i += 1) {
      await db.prisma.inventoryItem.create({
        data: {
          householdId: HOUSEHOLD,
          productId: rice.id,
          quantity: 1,
          purchaseDate: new Date(),
          expirationDate: null,
        },
      });
    }

    const counts = await countInventoryEntries(HOUSEHOLD);
    expect(counts.get(rice.id)).toBe(2);
    expect(counts.get(milk.id) ?? 0).toBe(0);
  });

  it("deletes inventory history with the product (AC-007)", async () => {
    const db = getTestDb();
    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "", minStockLevel: 0,
    });
    await db.prisma.inventoryItem.create({
      data: {
        householdId: HOUSEHOLD,
        productId: product.id,
        quantity: 2,
        purchaseDate: new Date(),
        expirationDate: null,
      },
    });
    expect(await countInventoryEntries(HOUSEHOLD).then((c) => c.get(product.id))).toBe(1);

    await deleteProduct(HOUSEHOLD, product.id);
    expect(db.inventory.size).toBe(0);
  });
});
