import { describe, expect, it } from "vitest";
import { resolveProductForPurchase } from "./purchase-to-stock";

describe("resolveProductForPurchase (spec shopping-lists BR-006/BR-007)", () => {
  it("reuses the linked product when present", () => {
    expect(
      resolveProductForPurchase({ productId: "p1", name: "Leite", done: true }),
    ).toEqual({ mode: "existing", productId: "p1" });
  });

  it("plans product creation from the item name when unlinked", () => {
    expect(
      resolveProductForPurchase({ productId: null, name: "  Tapioca ", done: true }),
    ).toEqual({ mode: "create", name: "Tapioca" });
  });

  it("rejects pending items (BR-006)", () => {
    expect(() =>
      resolveProductForPurchase({ productId: "p1", name: null, done: false }),
    ).toThrow("Marque o item como comprado antes de lançar no estoque");
  });

  it("rejects items with neither product nor name", () => {
    expect(() =>
      resolveProductForPurchase({ productId: null, name: "   ", done: true }),
    ).toThrow("Informe o nome ou selecione um produto");
  });
});
