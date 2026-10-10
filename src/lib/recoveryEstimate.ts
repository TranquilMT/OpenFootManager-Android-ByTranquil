import { calendarDay } from "./calendarDay";
/** An estimate from the saved countdown, not a medical guarantee. */
export function estimatedRecoveryDate(currentDate: string, daysRemaining: number): string | null {
  const day = calendarDay(currentDate);
  if (!day || !Number.isSafeInteger(daysRemaining) || daysRemaining < 0) return null;
  const date = new Date(Date.parse(day) + daysRemaining * 86400000);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
