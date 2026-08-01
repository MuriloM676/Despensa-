import { describe, expect, it } from "vitest";
import {
  addShoppingListItemSchema,
  createShoppingListSchema,
} from "./shopping-list";

describe("createShoppingListSchema", () => {
  it("requires a name", () => {
    expect(createShoppingListSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createShoppingListSchema.safeParse({ name: "Feira" }).success).toBe(true);
  });
});

describe("addShoppingListItemSchema", () => {
  it("requires name when no product is linked (BR-003)", () => {
    const result = addShoppingListItemSchema.safeParse({
      listId: "l1",
      quantity: "1",
      productId: "",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a linked product without a name", () => {
    const result = addShoppingListItemSchema.safeParse({
      listId: "l1",
      quantity: "2",
      productId: "p1",
      name: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity (BR-002)", () => {
    const result = addShoppingListItemSchema.safeParse({
      listId: "l1",
      quantity: "0",
      name: "Leite",
    });
    expect(result.success).toBe(false);
  });
});
