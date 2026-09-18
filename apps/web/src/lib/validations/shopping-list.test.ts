import { describe, expect, it } from "vitest";
import {
  addShoppingListItemSchema,
  createShoppingListSchema,
  deleteShoppingListItemSchema,
  deleteShoppingListSchema,
  toggleShoppingListItemSchema,
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

describe("toggleShoppingListItemSchema", () => {
  it("requires listId (B5)", () => {
    expect(
      toggleShoppingListItemSchema.safeParse({ itemId: "i1", done: true }).success,
    ).toBe(false);
    expect(
      toggleShoppingListItemSchema.safeParse({ itemId: "i1", listId: "l1", done: true })
        .success,
    ).toBe(true);
  });
});

describe("deleteShoppingListItemSchema", () => {
  it("requires itemId and listId (B5)", () => {
    expect(deleteShoppingListItemSchema.safeParse({ itemId: "i1" }).success).toBe(false);
    expect(
      deleteShoppingListItemSchema.safeParse({ itemId: "i1", listId: "l1" }).success,
    ).toBe(true);
  });
});

describe("deleteShoppingListSchema", () => {
  it("requires listId (B5)", () => {
    expect(deleteShoppingListSchema.safeParse({ listId: "" }).success).toBe(false);
    expect(deleteShoppingListSchema.safeParse({ listId: "l1" }).success).toBe(true);
  });
});
