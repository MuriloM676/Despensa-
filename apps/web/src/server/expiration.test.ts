import { describe, expect, it } from "vitest";
import {
  getExpirationStatus,
  daysUntil,
  normalizeAlertWindowDays,
  EXPIRING_SOON_DAYS,
} from "./expiration";
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

describe("getExpirationStatus with a per-household window (expiration BR-001)", () => {
  it("uses the custom window instead of the default (AC-002)", () => {
    expect(getExpirationStatus(new Date(2026, 7, 8), NOW, 10)).toBe(
      ExpirationStatus.ExpiringSoon,
    );
    expect(getExpirationStatus(new Date(2026, 7, 8), NOW, 5)).toBe(
      ExpirationStatus.Valid,
    );
  });

  it("narrows the alert list when the window shrinks (AC-004)", () => {
    const date = new Date(2026, 7, 5);
    expect(getExpirationStatus(date, NOW, 5)).toBe(ExpirationStatus.ExpiringSoon);
    expect(getExpirationStatus(date, NOW, 3)).toBe(ExpirationStatus.Valid);
  });

  it("still marks past dates as expired regardless of window", () => {
    expect(getExpirationStatus(new Date(2026, 6, 30), NOW, 30)).toBe(
      ExpirationStatus.Expired,
    );
  });
});

describe("normalizeAlertWindowDays", () => {
  it("accepts integers from 1 to 30", () => {
    expect(normalizeAlertWindowDays(1)).toBe(1);
    expect(normalizeAlertWindowDays(10)).toBe(10);
    expect(normalizeAlertWindowDays(30)).toBe(30);
  });

  it("falls back to the default outside the range", () => {
    expect(normalizeAlertWindowDays(0)).toBe(EXPIRING_SOON_DAYS);
    expect(normalizeAlertWindowDays(31)).toBe(EXPIRING_SOON_DAYS);
    expect(normalizeAlertWindowDays(null)).toBe(EXPIRING_SOON_DAYS);
    expect(normalizeAlertWindowDays("10")).toBe(EXPIRING_SOON_DAYS);
  });
});
