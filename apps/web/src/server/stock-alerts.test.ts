import { describe, expect, it } from "vitest";
import { findLowStock, sumStockByProduct } from "./stock-alerts";

describe("sumStockByProduct", () => {
  it("sums quantities per product, including fractional amounts", () => {
    const totals = sumStockByProduct([
      { productId: "rice", quantity: 1.5 },
      { productId: "rice", quantity: 0.5 },
      { productId: "milk", quantity: 2 },
    ]);
    expect(totals.get("rice")).toBe(2);
    expect(totals.get("milk")).toBe(2);
  });

  it("accepts Prisma Decimal-like quantities", () => {
    const totals = sumStockByProduct([
      { productId: "rice", quantity: { valueOf: () => 1.25, toString: () => "1.25" } },
    ]);
    expect(totals.get("rice")).toBe(1.25);
  });
});

describe("findLowStock (replenishment BR-002/BR-003/BR-004)", () => {
  it("flags stock below minimum with suggested quantity (AC-001)", () => {
    const result = findLowStock(
      [{ id: "rice", minStockLevel: 5 }],
      new Map([["rice", 2]]),
    );
    expect(result).toEqual([{ productId: "rice", stock: 2, minStock: 5, suggested: 3 }]);
  });

  it("ignores products without a minimum (AC-002, BR-004)", () => {
    expect(findLowStock([{ id: "rice", minStockLevel: 0 }], new Map())).toEqual([]);
    expect(findLowStock([{ id: "rice", minStockLevel: 0 }], new Map([["rice", 0]]))).toEqual(
      [],
    );
  });

  it("does not flag stock equal to the minimum (AC-003)", () => {
    expect(
      findLowStock([{ id: "rice", minStockLevel: 2.5 }], new Map([["rice", 2.5]])),
    ).toEqual([]);
  });

  it("flags zero stock when a minimum is set, regardless of expiration (AC-004)", () => {
    const result = findLowStock(
      [{ id: "milk", minStockLevel: 2 }],
      new Map(),
    );
    expect(result).toEqual([{ productId: "milk", stock: 0, minStock: 2, suggested: 2 }]);
  });

  it("rounds the suggestion to 3 decimals for fractional stock", () => {
    const result = findLowStock(
      [{ id: "oil", minStockLevel: 1 }],
      new Map([["oil", 0.3]]),
    );
    expect(result[0]?.suggested).toBe(0.7);
  });
});
