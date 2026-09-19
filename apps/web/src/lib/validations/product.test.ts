import { describe, expect, it } from "vitest";
import {
  createCategorySchema,
  createProductSchema,
  deleteCategorySchema,
  deleteProductSchema,
  updateProductSchema,
} from "./product";

describe("createProductSchema", () => {
  it("requires a name", () => {
    expect(createProductSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createProductSchema.safeParse({ name: "Leite" }).success).toBe(true);
  });

  it("defaults unit to un when omitted (BR-005)", () => {
    const result = createProductSchema.safeParse({ name: "Leite" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe("un");
    }
  });

  it("rejects an explicitly empty unit (BR-005)", () => {
    expect(createProductSchema.safeParse({ name: "Leite", unit: "" }).success).toBe(false);
    expect(createProductSchema.safeParse({ name: "Leite", unit: "  " }).success).toBe(false);
  });

  it("rejects a unit longer than 20 chars (BR-005)", () => {
    expect(
      createProductSchema.safeParse({ name: "Leite", unit: "x".repeat(21) }).success,
    ).toBe(false);
  });

  it("defaults the minimum stock level to 0 (replenishment FR-001)", () => {
    const result = createProductSchema.safeParse({ name: "Leite" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minStockLevel).toBe(0);
    }
  });

  it("accepts pt-BR decimals for the minimum stock level (replenishment BR-001)", () => {
    const result = createProductSchema.safeParse({ name: "Leite", minStockLevel: "2,5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minStockLevel).toBe(2.5);
    }
  });

  it("rejects negative or over-precise minimum stock levels (replenishment BR-001)", () => {
    expect(
      createProductSchema.safeParse({ name: "Leite", minStockLevel: -1 }).success,
    ).toBe(false);
    expect(
      createProductSchema.safeParse({ name: "Leite", minStockLevel: 1.2345 }).success,
    ).toBe(false);
  });
});

describe("deleteProductSchema", () => {
  it("requires a productId (B5)", () => {
    expect(deleteProductSchema.safeParse({ productId: "" }).success).toBe(false);
    expect(deleteProductSchema.safeParse({ productId: "p1" }).success).toBe(true);
  });
});

describe("updateProductSchema (B15)", () => {
  it("requires a productId plus the product fields", () => {
    expect(updateProductSchema.safeParse({ name: "Café" }).success).toBe(false);
    expect(
      updateProductSchema.safeParse({ productId: "p1", name: "Café", unit: "g" }).success,
    ).toBe(true);
  });

  it("applies the same field rules as creation (BR-010)", () => {
    expect(
      updateProductSchema.safeParse({ productId: "p1", name: "", unit: "g" }).success,
    ).toBe(false);
    expect(
      updateProductSchema.safeParse({ productId: "p1", name: "Café", unit: "" }).success,
    ).toBe(false);
  });
});

describe("createCategorySchema (B15)", () => {
  it("requires a trimmed name up to 120 chars (BR-011)", () => {
    expect(createCategorySchema.safeParse({ name: "" }).success).toBe(false);
    expect(createCategorySchema.safeParse({ name: "  " }).success).toBe(false);
    expect(createCategorySchema.safeParse({ name: "x".repeat(121) }).success).toBe(false);
    const result = createCategorySchema.safeParse({ name: "  Laticínios  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Laticínios");
    }
  });
});

describe("deleteCategorySchema (B15)", () => {
  it("requires a categoryId", () => {
    expect(deleteCategorySchema.safeParse({ categoryId: "" }).success).toBe(false);
    expect(deleteCategorySchema.safeParse({ categoryId: "c1" }).success).toBe(true);
  });
});
