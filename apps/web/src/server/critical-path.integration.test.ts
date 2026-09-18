import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@despensa/database", async () => {
  const { createInMemoryPrisma } = await import("./in-memory-prisma");
  const db = createInMemoryPrisma();
  globalThis.__despensaTestDb = db;
  return { prisma: db.prisma };
});

import { getTestDb } from "./in-memory-prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { getOrCreateHouseholdForUser } from "./household";
import { createProduct, listProducts } from "./product";
import { addInventoryItem, consumeInventory, listInventory } from "./inventory";
import {
  addShoppingListItem,
  createShoppingList,
  getShoppingList,
  renameShoppingList,
  toggleShoppingListItem,
} from "./shopping-list";
import { purchaseToStock } from "./purchase-to-stock";

beforeEach(() => {
  getTestDb().reset();
});

/** Mirrors the credential check in `auth.ts authorize` (schema + bcrypt). */
async function checkCredentials(email: string, password: string): Promise<boolean> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) return false;
  const user = await getTestDb().prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user?.passwordHash) return false;
  return bcrypt.compare(parsed.data.password, user.passwordHash);
}

describe("critical path: login -> produto -> estoque -> lista (B11)", () => {
  it("registers, logs in, provisions one household and runs the whole loop", async () => {
    const db = getTestDb();

    // 1. register validation + login check
    expect(registerSchema.safeParse({ name: "", email: "x", password: "short" }).success).toBe(
      false,
    );
    const parsed = registerSchema.safeParse({
      name: "Maria",
      email: "maria@example.com",
      password: "s3nha-segura",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) throw new Error("fixture failed");

    const user = await db.prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(parsed.data.password, 4),
      },
    });

    expect(await checkCredentials("maria@example.com", "s3nha-segura")).toBe(true);
    expect(await checkCredentials("maria@example.com", "errada")).toBe(false);
    expect(await checkCredentials("não-é-email", "s3nha-segura")).toBe(false);

    // 2. household provisioning is idempotent
    const household = await getOrCreateHouseholdForUser(user.id);
    const again = await getOrCreateHouseholdForUser(user.id);
    expect(again.id).toBe(household.id);

    // 3. produto -> estoque
    const product = await createProduct(household.id, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "",
    });
    await addInventoryItem(household.id, {
      productId: product.id,
      quantity: 5,
      purchaseDate: undefined,
      expirationDate: undefined,
    });
    expect(await listInventory(household.id)).toHaveLength(1);

    // 4. lista -> compra vira estoque (FR-009) -> consumo
    const list = await createShoppingList(household.id, { name: "Feira" });
    const item = await addShoppingListItem(household.id, {
      listId: list.id,
      quantity: 2,
      name: "",
      productId: product.id,
    });
    await toggleShoppingListItem(household.id, item.id, true);
    const purchase = await purchaseToStock(household.id, {
      itemId: item.id,
      listId: list.id,
      expirationDate: undefined,
    });
    expect(purchase.productId).toBe(product.id);

    await consumeInventory(household.id, { productId: product.id, quantity: 3 });
    const stock = (await listInventory(household.id)) as unknown as Array<{
      quantity: number;
    }>;
    const total = stock.reduce((sum, s) => sum + s.quantity, 0);
    expect(total).toBe(4); // 5 + 2 - 3

    await renameShoppingList(household.id, { listId: list.id, name: "Feira mensal" });
    const reloaded = (await getShoppingList(household.id, list.id)) as unknown as {
      name: string;
      items: Array<{ done: boolean }>;
    } | null;
    expect(reloaded?.name).toBe("Feira mensal");
    expect(reloaded?.items[0]?.done).toBe(true);
  });

  it("isolates the whole loop per household", async () => {
    const db = getTestDb();
    const alice = await db.prisma.user.create({
      data: {
        name: "Alice",
        email: "alice@example.com",
        passwordHash: await bcrypt.hash("s3nha-segura", 4),
      },
    });
    const bob = await db.prisma.user.create({
      data: {
        name: "Bob",
        email: "bob@example.com",
        passwordHash: await bcrypt.hash("outra-senha", 4),
      },
    });
    const homeA = await getOrCreateHouseholdForUser(alice.id);
    const homeB = await getOrCreateHouseholdForUser(bob.id);
    expect(homeA.id).not.toBe(homeB.id);

    const product = await createProduct(homeA.id, {
      name: "Leite",
      brand: "",
      unit: "L",
      categoryId: "",
    });
    await addInventoryItem(homeA.id, {
      productId: product.id,
      quantity: 2,
      purchaseDate: undefined,
      expirationDate: undefined,
    });
    const list = await createShoppingList(homeA.id, { name: "Feira" });

    expect(await listProducts(homeB.id)).toHaveLength(0);
    expect(await listInventory(homeB.id)).toHaveLength(0);
    expect(await getShoppingList(homeB.id, list.id)).toBeNull();
    await expect(
      renameShoppingList(homeB.id, { listId: list.id, name: "Invasão" }),
    ).rejects.toThrow("Lista não encontrada");
    await expect(
      consumeInventory(homeB.id, { productId: product.id, quantity: 1 }),
    ).rejects.toThrow();
  });
});
