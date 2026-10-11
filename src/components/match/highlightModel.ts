import type { MatchEvent } from "./types";
export interface MatchHighlight {
  id: string;
  events: MatchEvent[];
  outcome: MatchEvent;
}
const OUTCOMES = new Set(["Goal", "PenaltyGoal"]);
/** Replay engine events; these are observations, not continuous tracking coordinates. */
export function buildMatchHighlights(events: MatchEvent[], _minute: number): MatchHighlight[] {
  const clips: MatchHighlight[] = [];
  let sequence: MatchEvent[] = [];
  for (const [index, event] of events.entries()) {
    sequence.push(event);
    if (OUTCOMES.has(event.event_type)) {
      clips.push({ id: `highlight-${index}`, events: [...sequence], outcome: event });
      sequence = [];
    }
  }
  return clips;
}
