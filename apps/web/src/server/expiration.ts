import { ExpirationStatus } from "@despensa/types";

export const EXPIRING_SOON_DAYS = 5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function calendarDayMs(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.round((calendarDayMs(date) - calendarDayMs(now)) / MS_PER_DAY);
}

export function getExpirationStatus(
  expirationDate: Date | null,
  now: Date = new Date(),
): ExpirationStatus {
  if (!expirationDate) {
    return ExpirationStatus.Valid;
  }

  const days = daysUntil(expirationDate, now);
  if (days < 0) {
    return ExpirationStatus.Expired;
  }
  if (days <= EXPIRING_SOON_DAYS) {
    return ExpirationStatus.ExpiringSoon;
  }
  return ExpirationStatus.Valid;
}
