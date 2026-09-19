import { describe, expect, it } from "vitest";
import { planFefoConsumption, InsufficientStockError } from "./fefo";

function entry(id: string, quantity: number, expiration: string | null) {
  return {
    id,
    quantity,
    expirationDate: expiration ? new Date(expiration) : null,
  };
}

describe("planFefoConsumption", () => {
  it("consumes the entry that expires first (AC-001)", () => {
    const plan = planFefoConsumption(
      [
        entry("a", 2, "2026-08-10"),
        entry("b", 2, "2026-08-20"),
      ],
      2,
    );

    expect(plan).toEqual([{ itemId: "a", amount: 2 }]);
  });

  it("rejects consumption larger than available stock (AC-002)", () => {
    expect(() =>
      planFefoConsumption([entry("a", 1, "2026-08-10")], 2),
    ).toThrow(InsufficientStockError);
  });

  it("consumes entries without expiration last (AC-005)", () => {
    const plan = planFefoConsumption(
      [
        entry("a", 3, null),
        entry("b", 2, "2026-08-10"),
      ],
      2,
    );

    expect(plan).toEqual([{ itemId: "b", amount: 2 }]);
  });

  it("spills across multiple entries in date order", () => {
    const plan = planFefoConsumption(
      [
        entry("a", 2, "2026-08-10"),
        entry("b", 3, "2026-08-20"),
        entry("c", 1, null),
      ],
      4,
    );

    expect(plan).toEqual([
      { itemId: "a", amount: 2 },
      { itemId: "b", amount: 2 },
    ]);
  });

  it("throws for non-positive quantity", () => {
    expect(() => planFefoConsumption([entry("a", 2, null)], 0)).toThrow(
      "Quantity must be greater than zero",
    );
  });

  it("consumes a fractional amount partially (AC-009)", () => {
    const plan = planFefoConsumption([entry("a", 1.5, null)], 0.5);

    expect(plan).toEqual([{ itemId: "a", amount: 0.5 }]);
  });

  it("spills fractional consumes across lots in FEFO order (AC-010)", () => {
    const plan = planFefoConsumption(
      [
        entry("a", 0.2, "2026-08-10"),
        entry("b", 0.2, "2026-08-20"),
        entry("c", 0.2, null),
      ],
      0.5,
    );

    expect(plan).toEqual([
      { itemId: "a", amount: 0.2 },
      { itemId: "b", amount: 0.2 },
      { itemId: "c", amount: 0.1 },
    ]);
  });

  it("zeroes fractional lots exactly, with no float dust", () => {
    const plan = planFefoConsumption(
      [
        entry("a", 0.2, "2026-08-10"),
        entry("b", 0.2, "2026-08-20"),
        entry("c", 0.2, null),
      ],
      0.6,
    );

    expect(plan).toEqual([
      { itemId: "a", amount: 0.2 },
      { itemId: "b", amount: 0.2 },
      { itemId: "c", amount: 0.2 },
    ]);
  });
});
