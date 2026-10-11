import { formatMatchMinute } from "./matchClock";
import type { MatchEvent } from "./types";

/** Recover an event's phase from recorded kickoff/break markers, never the current screen phase. */
export function eventClockLabels(events: readonly MatchEvent[]): Map<MatchEvent, string> {
  const labels = new Map<MatchEvent, string>();
  let phase = "";
  for (const event of events) {
    if (event.event_type === "KickOff") {
      if (event.minute === 0) phase = "FirstHalf";
      else if (phase === "SecondHalf") phase = "ExtraTimeFirstHalf";
    } else if (event.event_type === "SecondHalfStart") {
      if (phase === "FirstHalf" || phase === "HalfTime") phase = "SecondHalf";
      else if (phase === "ExtraTimeFirstHalf" || phase === "ExtraTimeHalfTime")
        phase = "ExtraTimeSecondHalf";
    }
    labels.set(event, formatMatchMinute(phase, event.minute));
    if (event.event_type === "HalfTime") {
      if (phase === "FirstHalf") phase = "HalfTime";
      else if (phase === "ExtraTimeFirstHalf") phase = "ExtraTimeHalfTime";
    }
  }
  return labels;
}
