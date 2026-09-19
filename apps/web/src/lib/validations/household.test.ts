import { describe, expect, it } from "vitest";
import { updateAlertWindowSchema } from "./household";

describe("updateAlertWindowSchema (expiration BR-001)", () => {
  it("accepts integers from 1 to 30", () => {
    expect(updateAlertWindowSchema.safeParse({ alertWindowDays: 1 }).success).toBe(true);
    expect(updateAlertWindowSchema.safeParse({ alertWindowDays: 30 }).success).toBe(true);
  });

  it("coerces string form input", () => {
    const result = updateAlertWindowSchema.safeParse({ alertWindowDays: "7" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alertWindowDays).toBe(7);
    }
  });

  it("rejects values outside 1..30", () => {
    expect(updateAlertWindowSchema.safeParse({ alertWindowDays: 0 }).success).toBe(false);
    expect(updateAlertWindowSchema.safeParse({ alertWindowDays: 31 }).success).toBe(false);
    expect(updateAlertWindowSchema.safeParse({ alertWindowDays: 2.5 }).success).toBe(false);
  });
});
