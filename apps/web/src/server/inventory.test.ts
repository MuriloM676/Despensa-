import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@despensa/database", () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@despensa/database";
import {
  consumeInventory,
  countStockedProducts,
  listInventory,
} from "./inventory";

type StockEntry = { id: string; quantity: number; expirationDate: Date | null };

function stockEntry(id: string, quantity: number, expiration: string | null): StockEntry {
  return { id, quantity, expirationDate: expiration ? new Date(expiration) : null };
}

type FindManyResult = Awaited<ReturnType<typeof prisma.inventoryItem.findMany>>;

function mockStock(entries: StockEntry[]): void {
  vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
    entries as unknown as FindManyResult,
  );
}

// The tx client exposes the same surface in tests, so reads, locks and
// writes can be asserted on the shared mock.
vi.mocked(prisma.$executeRaw).mockResolvedValue(0);
vi.mocked(prisma.$transaction).mockImplementation(
  ((callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)) as unknown as typeof prisma.$transaction,
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listInventory", () => {
  it("hides zeroed/consumed lines and orders FEFO with NULLS LAST (B2+B10)", async () => {
    mockStock([]);
    await listInventory("household-1");

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          householdId: "household-1",
          consumedAt: null,
          quantity: { gt: 0 },
        }),
        orderBy: [
          { product: { name: "asc" } },
          { expirationDate: { sort: "asc", nulls: "last" } },
        ],
      }),
    );
  });
});

describe("consumeInventory", () => {
  it("removes the entry when consumption zeroes it (AC-006, B2)", async () => {
    mockStock([stockEntry("a", 2, "2026-08-10")]);

    const plan = await consumeInventory("household-1", {
      productId: "product-1",
      quantity: 2,
    });

    expect(plan).toEqual([{ itemId: "a", amount: 2 }]);
    expect(prisma.inventoryItem.delete).toHaveBeenCalledWith({ where: { id: "a" } });
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("decrements when stock remains and deletes only the zeroed line", async () => {
    mockStock([
      stockEntry("a", 2, "2026-08-10"),
      stockEntry("b", 3, "2026-08-20"),
    ]);

    const plan = await consumeInventory("household-1", {
      productId: "product-1",
      quantity: 4,
    });

    expect(plan).toEqual([
      { itemId: "a", amount: 2 },
      { itemId: "b", amount: 2 },
    ]);
    expect(prisma.inventoryItem.delete).toHaveBeenCalledWith({ where: { id: "a" } });
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: "b" },
      data: { quantity: { decrement: 2 } },
    });
  });

  it("queries FEFO order with NULLS LAST explicit (B10)", async () => {
    mockStock([stockEntry("b", 2, "2026-08-10")]);

    await consumeInventory("household-1", { productId: "product-1", quantity: 1 });

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { expirationDate: { sort: "asc", nulls: "last" } },
      }),
    );
  });

  it("deletes a fractional entry read back as a Prisma Decimal (B12)", async () => {
    // Real Prisma returns Decimal objects for Decimal(10,3); the service
    // must still detect a full consume and delete instead of decrementing.
    const decimalLike = {
      valueOf: () => 1.5,
      toString: () => "1.5",
    };
    mockStock([{ id: "a", quantity: decimalLike, expirationDate: null } as never]);

    const plan = await consumeInventory("household-1", {
      productId: "product-1",
      quantity: 1.5,
    });

    expect(plan).toEqual([{ itemId: "a", amount: 1.5 }]);
    expect(prisma.inventoryItem.delete).toHaveBeenCalledWith({ where: { id: "a" } });
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
  });

  it("locks rows before reading inside a serializable transaction (B9)", async () => {
    mockStock([stockEntry("a", 3, "2026-08-10")]);

    await consumeInventory("household-1", { productId: "product-1", quantity: 1 });

    const txCalls = vi.mocked(prisma.$transaction).mock
      .calls as unknown as Array<[callback: unknown, options: unknown]>;
    const firstTxCall = txCalls[0];
    if (!firstTxCall) {
      throw new Error("expected $transaction to be called");
    }
    const [callback, options] = firstTxCall;
    expect(typeof callback).toBe("function");
    expect(options).toMatchObject({ isolationLevel: "Serializable" });

    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    const rawCalls = vi.mocked(prisma.$executeRaw).mock.calls as unknown as unknown[][];
    const firstRawCall = rawCalls[0];
    if (!firstRawCall) {
      throw new Error("expected $executeRaw to be called");
    }
    const [template] = firstRawCall;
    const sql = (template as unknown as string[]).join("");
    expect(sql).toContain("FOR UPDATE");
    expect(sql).toContain('"InventoryItem"');

    const rawOrder = vi.mocked(prisma.$executeRaw).mock.invocationCallOrder[0];
    const findOrder = vi.mocked(prisma.inventoryItem.findMany).mock.invocationCallOrder[0];
    if (rawOrder === undefined || findOrder === undefined) {
      throw new Error("expected lock and read to be recorded");
    }
    expect(rawOrder).toBeLessThan(findOrder);
  });
});

describe("countStockedProducts", () => {
  it("counts distinct products instead of summing mixed units (AC-007, B13)", () => {
    expect(
      countStockedProducts([
        { productId: "rice" },
        { productId: "rice" },
        { productId: "milk" },
      ]),
    ).toBe(2);
  });

  it("returns 0 for empty stock", () => {
    expect(countStockedProducts([])).toBe(0);
  });
});
