/** Manager breaks and shootouts are advanced by their own screens, never a live timer. */
export function canAdvanceLivePhase(phase: string): boolean {
  return [
    "PreKickOff",
    "FirstHalf",
    "SecondHalf",
    "ExtraTimeFirstHalf",
    "ExtraTimeSecondHalf",
  ].includes(phase);
}
