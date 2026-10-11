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
    if (["KickOff", "HalfTime", "SecondHalfStart", "FullTime"].includes(event.event_type)) {
      sequence = [];
      continue;
    }
    if (["Corner", "FreeKick", "GoalKick", "PenaltyAwarded"].includes(event.event_type))
      sequence = [];
    if (sequence.at(-1)?.side !== event.side) sequence = [];
    if (sequence.length && event.minute - sequence[sequence.length - 1].minute > 3) sequence = [];
    if (["Substitution", "TacticalChange"].includes(event.event_type)) continue;
    if (["Injury", "RedCard", "SecondYellow", "YellowCard"].includes(event.event_type))
      sequence = [];
    sequence.push(event);
    sequence = sequence.slice(-8);
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
