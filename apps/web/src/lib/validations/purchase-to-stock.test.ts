import { describe, expect, it } from "vitest";
import { purchaseToStockSchema } from "./purchase-to-stock";

describe("purchaseToStockSchema", () => {
  it("accepts an item without expiration date", () => {
    const result = purchaseToStockSchema.safeParse({
      itemId: "i1",
      listId: "l1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an optional expiration date as string", () => {
    const result = purchaseToStockSchema.safeParse({
      itemId: "i1",
      listId: "l1",
      expirationDate: "2026-09-30",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expirationDate).toBeInstanceOf(Date);
    }
  });

  it("treats empty expiration string as undefined", () => {
    const result = purchaseToStockSchema.safeParse({
      itemId: "i1",
      listId: "l1",
      expirationDate: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expirationDate).toBeUndefined();
    }
  });

  it("rejects invalid expiration dates", () => {
    const result = purchaseToStockSchema.safeParse({
      itemId: "i1",
      listId: "l1",
      expirationDate: "not-a-date",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Data inválida");
    }
  });

  it("requires itemId and listId", () => {
    expect(purchaseToStockSchema.safeParse({ listId: "l1" }).success).toBe(false);
    expect(purchaseToStockSchema.safeParse({ itemId: "i1" }).success).toBe(false);
  });
});
