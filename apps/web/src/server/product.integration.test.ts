import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@despensa/database", async () => {
  const { createInMemoryPrisma } = await import("./in-memory-prisma");
  const db = createInMemoryPrisma();
  globalThis.__despensaTestDb = db;
  return { prisma: db.prisma };
});

import { getTestDb } from "./in-memory-prisma";
import { createProduct, deleteProduct, listCategories, listProducts } from "./product";

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
      categoryId: category.id,
    });

    expect(product).toMatchObject({
      householdId: HOUSEHOLD,
      name: "Leite",
      brand: null,
      unit: "L",
      categoryId: category.id,
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
      categoryId: "",
    });

    await expect(
      createProduct(HOUSEHOLD, {
        name: "Café",
        brand: "Pilão",
        unit: "g",
        categoryId: "",
      }),
    ).rejects.toThrow(DUPLICATE_MESSAGE);
  });

  it("rejects duplicates with empty brand (NULL brand, app-level)", async () => {
    await createProduct(HOUSEHOLD, { name: "Açúcar", brand: "", unit: "kg", categoryId: "" });

    await expect(
      createProduct(HOUSEHOLD, { name: "Açúcar", brand: "", unit: "kg", categoryId: "" }),
    ).rejects.toThrow(DUPLICATE_MESSAGE);
  });

  it("maps a P2002 race into the friendly duplicate message", async () => {
    getTestDb().failNextProductCreateWithP2002 = true;

    await expect(
      createProduct(HOUSEHOLD, {
        name: "Corrida",
        brand: "Única",
        unit: "un",
        categoryId: "",
      }),
    ).rejects.toThrow(DUPLICATE_MESSAGE);
  });

  it("allows the same name and brand in another household", async () => {
    await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "Parmalat",
      unit: "L",
      categoryId: "",
    });

    const other = await createProduct(OTHER, {
      name: "Leite",
      brand: "Parmalat",
      unit: "L",
      categoryId: "",
    });
    expect(other.householdId).toBe(OTHER);
  });

  it("allows the same name with a different brand", async () => {
    await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "A",
      unit: "L",
      categoryId: "",
    });
    const second = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "B",
      unit: "L",
      categoryId: "",
    });
    expect(second.brand).toBe("B");
  });

  it("rejects an invalid or foreign category", async () => {
    await expect(
      createProduct(HOUSEHOLD, {
        name: "Leite",
        brand: "",
        unit: "L",
        categoryId: "missing",
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
        categoryId: foreign.id,
      }),
    ).rejects.toThrow("Categoria inválida");
  });

  it("deletes scoped to the household and lists categories scoped", async () => {
    const product = await createProduct(HOUSEHOLD, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "",
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
});
