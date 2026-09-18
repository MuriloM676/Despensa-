import { describe, expect, it } from "vitest";
import { createProductSchema, deleteProductSchema } from "./product";

describe("createProductSchema", () => {
  it("requires a name", () => {
    expect(createProductSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createProductSchema.safeParse({ name: "Leite" }).success).toBe(true);
  });
});

describe("deleteProductSchema", () => {
  it("requires a productId (B5)", () => {
    expect(deleteProductSchema.safeParse({ productId: "" }).success).toBe(false);
    expect(deleteProductSchema.safeParse({ productId: "p1" }).success).toBe(true);
  });
});
