/** Display only recorded minutes; never infer how much added time will be played. */
export function formatMatchMinute(phase: string, minute: number): string {
  const value = Number.isFinite(minute) ? Math.max(0, Math.floor(minute)) : 0;
  const boundaries: Record<string, number> = { FirstHalf: 45, SecondHalf: 90, ExtraTimeFirstHalf: 105, ExtraTimeSecondHalf: 120 };
  const boundary = boundaries[phase];
  return boundary != null && value > boundary ? `${boundary}+${value - boundary}` : String(value);
}
