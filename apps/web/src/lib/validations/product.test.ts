import { describe, expect, it } from "vitest";
import { createProductSchema, deleteProductSchema } from "./product";

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
});

describe("deleteProductSchema", () => {
  it("requires a productId (B5)", () => {
    expect(deleteProductSchema.safeParse({ productId: "" }).success).toBe(false);
    expect(deleteProductSchema.safeParse({ productId: "p1" }).success).toBe(true);
  });
});
