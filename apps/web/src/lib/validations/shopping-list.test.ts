import { describe, expect, it } from "vitest";
import {
  addShoppingListItemSchema,
  createShoppingListSchema,
  deleteShoppingListItemSchema,
  deleteShoppingListSchema,
  renameShoppingListSchema,
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

describe("renameShoppingListSchema (FR-002)", () => {
  it("requires listId", () => {
    expect(renameShoppingListSchema.safeParse({ name: "Feira" }).success).toBe(false);
    expect(renameShoppingListSchema.safeParse({ listId: "", name: "Feira" }).success).toBe(
      false,
    );
  });

  it("requires a non-empty name", () => {
    expect(renameShoppingListSchema.safeParse({ listId: "l1", name: "" }).success).toBe(
      false,
    );
    expect(renameShoppingListSchema.safeParse({ listId: "l1", name: "  " }).success).toBe(
      false,
    );
    expect(renameShoppingListSchema.safeParse({ listId: "l1", name: "Feira" }).success).toBe(
      true,
    );
  });

  it("trims the name and rejects names longer than 120 chars", () => {
    const result = renameShoppingListSchema.safeParse({ listId: "l1", name: "  Feira  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Feira");
    }
    expect(
      renameShoppingListSchema.safeParse({ listId: "l1", name: "x".repeat(121) }).success,
    ).toBe(false);
  });
});
