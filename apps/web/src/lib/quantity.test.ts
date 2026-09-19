import { describe, expect, it } from "vitest";
import { formatQuantity, quantityToNumber } from "./quantity";

describe("quantityToNumber", () => {
  it("passes numbers through and converts Decimal-like values", () => {
    expect(quantityToNumber(0.5)).toBe(0.5);
    expect(quantityToNumber("1.25")).toBe(1.25);
    expect(quantityToNumber({ toString: () => "2.5", valueOf: () => 2.5 })).toBe(2.5);
  });
});

describe("formatQuantity", () => {
  it("formats with pt-BR decimal separator and up to 3 places", () => {
    expect(formatQuantity(0.5)).toBe("0,5");
    expect(formatQuantity(1)).toBe("1");
    expect(formatQuantity(0.125)).toBe("0,125");
  });
});
