import { describe, expect, it } from "vitest";
import {
  addInventoryItemSchema,
  consumeInventorySchema,
} from "./inventory";

describe("addInventoryItemSchema", () => {
  it("accepts a valid item with dates as strings", () => {
    const result = addInventoryItemSchema.safeParse({
      productId: "p1",
      quantity: "2",
      purchaseDate: "2026-08-01",
      expirationDate: "2026-08-10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(2);
      expect(result.data.expirationDate).toBeInstanceOf(Date);
    }
  });

  it("rejects zero quantity (BR-001)", () => {
    const result = addInventoryItemSchema.safeParse({
      productId: "p1",
      quantity: "0",
    });
    expect(result.success).toBe(false);
  });

  it("allows missing expiration date (BR-002)", () => {
    const result = addInventoryItemSchema.safeParse({
      productId: "p1",
      quantity: "1",
    });
    expect(result.success).toBe(true);
  });

  it("treats empty date strings as undefined", () => {
    const result = addInventoryItemSchema.safeParse({
      productId: "p1",
      quantity: "1",
      expirationDate: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expirationDate).toBeUndefined();
    }
  });

  it("requires a product", () => {
    const result = addInventoryItemSchema.safeParse({ quantity: "1" });
    expect(result.success).toBe(false);
  });
});

describe("consumeInventorySchema", () => {
  it("rejects zero or negative quantities", () => {
    expect(consumeInventorySchema.safeParse({ productId: "p1", quantity: "0" }).success).toBe(
      false,
    );
    expect(consumeInventorySchema.safeParse({ productId: "p1", quantity: "-1" }).success).toBe(
      false,
    );
  });
});
