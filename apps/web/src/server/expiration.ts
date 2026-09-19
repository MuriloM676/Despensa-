import { ExpirationStatus } from "@despensa/types";

export const EXPIRING_SOON_DAYS = 5;

export const MIN_ALERT_WINDOW_DAYS = 1;

export const MAX_ALERT_WINDOW_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calendarDayMs(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.round((calendarDayMs(date) - calendarDayMs(now)) / MS_PER_DAY);
}

export function getExpirationStatus(
  expirationDate: Date | null,
  now: Date = new Date(),
  windowDays: number = EXPIRING_SOON_DAYS,
): ExpirationStatus {
  if (!expirationDate) {
    return ExpirationStatus.Valid;
  }

  const days = daysUntil(expirationDate, now);
  if (days < 0) {
    return ExpirationStatus.Expired;
  }
  if (days <= windowDays) {
    return ExpirationStatus.ExpiringSoon;
  }
  return ExpirationStatus.Valid;
}

/**
 * MVP 2: the alert window is configurable per household
 * (`Household.alertWindowDays`, BR-001 of `expiration.md`). Values outside
 * the accepted range fall back to the default instead of throwing, so a
 * legacy or out-of-range row can never break the dashboard.
 */
export function normalizeAlertWindowDays(value: unknown): number {
  const days = typeof value === "number" ? Math.floor(value) : NaN;
  if (!Number.isFinite(days) || days < MIN_ALERT_WINDOW_DAYS || days > MAX_ALERT_WINDOW_DAYS) {
    return EXPIRING_SOON_DAYS;
  }
  return days;
}
