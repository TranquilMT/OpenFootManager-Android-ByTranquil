import { reachedMatchEvents } from "./livePitchModel";
import type { MatchEvent } from "./types";
export type HighlightMode = "key" | "extended";
export interface MatchHighlight {
  id: string;
  events: MatchEvent[];
  outcome: MatchEvent;
}
const OUTCOMES = new Set([
  "Goal",
  "PenaltyGoal",
  "PenaltyAwarded",
  "PenaltyMiss",
  "RedCard",
  "SecondYellow",
  "Injury",
]);
function isKeyOutcome(event: MatchEvent) {
  const detail = event.detail;
  return (
    OUTCOMES.has(event.event_type) ||
    detail === "Woodwork" ||
    (typeof detail === "object" &&
      detail !== null &&
      (("Shot" in detail && detail.Shot.danger === "BigChance") ||
        ("Save" in detail && detail.Save.quality === "WorldClass")))
  );
}
/** Replay engine events; these are observations, not continuous tracking coordinates. */
export function buildMatchHighlights(
  events: MatchEvent[],
  minute: number,
  mode: HighlightMode = "key",
): MatchHighlight[] {
  const clips: MatchHighlight[] = [];
  let sequence: MatchEvent[] = [];
  for (const [index, event] of reachedMatchEvents(events, minute).entries()) {
    sequence.push(event);
    if (
      isKeyOutcome(event) ||
      (mode === "extended" &&
        new Set(["ShotOnTarget", "ShotSaved", "ShotOffTarget", "ShotBlocked", "YellowCard"]).has(
          event.event_type,
        ))
    ) {
      clips.push({ id: `highlight-${index}`, events: [...sequence], outcome: event });
      sequence = [];
    }
  }
  return clips;
}
