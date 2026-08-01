import { describe, expect, it } from "vitest";
import { getExpirationStatus, daysUntil } from "./expiration";
import { ExpirationStatus } from "@despensa/types";

const NOW = new Date(2026, 7, 1, 12, 0, 0);

describe("getExpirationStatus", () => {
  it("returns Valid for null expiration", () => {
    expect(getExpirationStatus(null, NOW)).toBe(ExpirationStatus.Valid);
  });

  it("marks past dates as expired (AC-003)", () => {
    expect(getExpirationStatus(new Date(2026, 6, 31), NOW)).toBe(
      ExpirationStatus.Expired,
    );
  });

  it("marks dates within 5 days as expiring soon (AC-004)", () => {
    expect(getExpirationStatus(new Date(2026, 7, 1), NOW)).toBe(
      ExpirationStatus.ExpiringSoon,
    );
    expect(getExpirationStatus(new Date(2026, 7, 5), NOW)).toBe(
      ExpirationStatus.ExpiringSoon,
    );
  });

  it("marks dates beyond 5 days as valid", () => {
    expect(getExpirationStatus(new Date(2026, 7, 7), NOW)).toBe(
      ExpirationStatus.Valid,
    );
  });
});

describe("daysUntil", () => {
  it("computes whole-day difference", () => {
    expect(daysUntil(new Date(2026, 7, 5), NOW)).toBe(4);
  });

  it("is negative for past dates", () => {
    expect(daysUntil(new Date(2026, 6, 30), NOW)).toBe(-2);
  });
});
