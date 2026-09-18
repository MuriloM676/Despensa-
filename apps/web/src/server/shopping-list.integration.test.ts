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
  deleteShoppingList,
  deleteShoppingListItem,
  getShoppingList,
  listShoppingLists,
  renameShoppingList,
  toggleShoppingListItem,
} from "./shopping-list";

const HOUSEHOLD = "household-1";
const OTHER = "household-2";

beforeEach(() => {
  getTestDb().reset();
});

describe("shopping-list integration (B11, in-memory Prisma)", () => {
  it("creates and lists lists newest-first, scoped to the household", async () => {
    const feira = await createShoppingList(HOUSEHOLD, { name: "Feira" });
    await createShoppingList(HOUSEHOLD, { name: "Mercado" });
    await createShoppingList(OTHER, { name: "Alheia" });
    // Same-millisecond createdAt is unordered even on real Postgres; pin the
    // fixture so the newest-first assertion is deterministic.
    const stored = getTestDb().lists.get(feira.id);
    if (!stored) throw new Error("fixture failed");
    stored.createdAt = new Date("2026-01-01T00:00:00Z");

    const lists = (await listShoppingLists(HOUSEHOLD)) as unknown as Array<{
      name: string;
    }>;
    expect(lists.map((l) => l.name)).toEqual(["Mercado", "Feira"]);
  });

  it("renames a list (FR-002) and rejects foreign lists", async () => {
    const list = await createShoppingList(HOUSEHOLD, { name: "Feira" });
    await createShoppingList(OTHER, { name: "Alheia" });
    const foreign = (
      (await listShoppingLists(OTHER)) as unknown as Array<{ id: string }>
    )[0];
    if (!foreign) throw new Error("fixture failed");

    await renameShoppingList(HOUSEHOLD, { listId: list.id, name: "Feira mensal" });
    const updated = (await getShoppingList(HOUSEHOLD, list.id)) as unknown as {
      name: string;
    } | null;
    expect(updated?.name).toBe("Feira mensal");

    await expect(
      renameShoppingList(HOUSEHOLD, { listId: foreign.id, name: "Invasão" }),
    ).rejects.toThrow("Lista não encontrada");
    await expect(
      renameShoppingList(HOUSEHOLD, { listId: "missing", name: "Nada" }),
    ).rejects.toThrow("Lista não encontrada");
  });

  it("adds items by name or linked product, rejecting empty ones", async () => {
    const list = await createShoppingList(HOUSEHOLD, { name: "Feira" });
    const product = await getTestDb().prisma.product.create({
      data: { householdId: HOUSEHOLD, name: "Leite", brand: null, unit: "L", categoryId: null },
    });

    const byName = await addShoppingListItem(HOUSEHOLD, {
      listId: list.id,
      quantity: 2,
      name: "Pão",
      productId: "",
    });
    expect(byName).toMatchObject({ name: "Pão", quantity: 2, productId: null });

    const linked = await addShoppingListItem(HOUSEHOLD, {
      listId: list.id,
      quantity: 1,
      name: "",
      productId: product.id,
    });
    expect(linked).toMatchObject({ productId: product.id });

    await expect(
      addShoppingListItem(HOUSEHOLD, {
        listId: list.id,
        quantity: 1,
        name: "",
        productId: "",
      }),
    ).rejects.toThrow("Informe o nome ou selecione um produto");

    await expect(
      addShoppingListItem(HOUSEHOLD, {
        listId: "missing",
        quantity: 1,
        name: "Pão",
        productId: "",
      }),
    ).rejects.toThrow("Lista não encontrada");
  });

  it("rejects items on a list from another household", async () => {
    const foreign = await createShoppingList(OTHER, { name: "Alheia" });
    await expect(
      addShoppingListItem(HOUSEHOLD, {
        listId: foreign.id,
        quantity: 1,
        name: "Pão",
        productId: "",
      }),
    ).rejects.toThrow("Lista não encontrada");
  });

  it("toggles done and deletes items with household scoping", async () => {
    const list = await createShoppingList(HOUSEHOLD, { name: "Feira" });
    const item = await addShoppingListItem(HOUSEHOLD, {
      listId: list.id,
      quantity: 1,
      name: "Leite",
      productId: "",
    });

    const done = await toggleShoppingListItem(HOUSEHOLD, item.id, true);
    expect(done.done).toBe(true);

    await expect(toggleShoppingListItem(OTHER, item.id, false)).rejects.toThrow(
      "Item não encontrado",
    );

    await deleteShoppingListItem(HOUSEHOLD, item.id);
    const after = (await getShoppingList(HOUSEHOLD, list.id)) as unknown as {
      items: unknown[];
    } | null;
    expect(after?.items).toHaveLength(0);

    await expect(deleteShoppingListItem(HOUSEHOLD, item.id)).rejects.toThrow(
      "Item não encontrado",
    );
  });

  it("deletes a list with its items and rejects unknown or foreign ids", async () => {
    const list = await createShoppingList(HOUSEHOLD, { name: "Feira" });
    await addShoppingListItem(HOUSEHOLD, {
      listId: list.id,
      quantity: 1,
      name: "Leite",
      productId: "",
    });
    const foreign = await createShoppingList(OTHER, { name: "Alheia" });

    await expect(deleteShoppingList(HOUSEHOLD, foreign.id)).rejects.toThrow(
      "Lista não encontrada",
    );
    await deleteShoppingList(HOUSEHOLD, list.id);
    expect(await getShoppingList(HOUSEHOLD, list.id)).toBeNull();
    expect(getTestDb().listItems.size).toBe(0);
  });

  it("getShoppingList returns items with products and respects scoping", async () => {
    const list = await createShoppingList(HOUSEHOLD, { name: "Feira" });
    const product = await getTestDb().prisma.product.create({
      data: { householdId: HOUSEHOLD, name: "Café", brand: null, unit: "g", categoryId: null },
    });
    await addShoppingListItem(HOUSEHOLD, {
      listId: list.id,
      quantity: 1,
      name: "",
      productId: product.id,
    });

    const found = (await getShoppingList(HOUSEHOLD, list.id)) as unknown as {
      items: Array<{ product: { name: string } | null }>;
    } | null;
    expect(found?.items).toHaveLength(1);
    expect(found?.items[0]?.product?.name).toBe("Café");
    expect(await getShoppingList(OTHER, list.id)).toBeNull();
  });
});
