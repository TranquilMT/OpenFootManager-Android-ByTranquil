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
  "ShootoutGoal",
  "ShootoutMiss",
  "RedCard",
  "SecondYellow",
  "Injury",
]);
const SHOT_TYPES = new Set(["ShotOnTarget", "ShotSaved", "ShotOffTarget", "ShotBlocked"]);
function isKeyOutcome(event: MatchEvent) {
  const detail = event.detail;
  const xg = event.shot?.expected_goals;
  if (
    xg !== undefined &&
    Number.isFinite(xg) &&
    xg >= 0.3 &&
    xg <= 1 &&
    ["ShotOnTarget", "ShotSaved", "ShotOffTarget", "ShotBlocked"].includes(event.event_type)
  )
    return true;
  return (
    OUTCOMES.has(event.event_type) ||
    (SHOT_TYPES.has(event.event_type) &&
      (detail === "Woodwork" ||
        (typeof detail === "object" &&
          detail !== null &&
          (("Shot" in detail && detail.Shot?.danger === "BigChance") ||
            ("Save" in detail && detail.Save?.quality === "WorldClass")))))
  );
}
/** Replay engine events; these are observations, not continuous tracking coordinates. */
export function buildMatchHighlights(
  events: MatchEvent[],
  minute: number,
  mode: HighlightMode = "key",
): MatchHighlight[] {
  const clips: MatchHighlight[] = [];
  const occurrences = new Map<string, number>();
  let sequence: MatchEvent[] = [];
  for (const event of reachedMatchEvents(events, minute)) {
    if (event.side !== "Home" && event.side !== "Away") {
      sequence = [];
      continue;
    }
    if (["KickOff", "HalfTime", "SecondHalfStart", "FullTime"].includes(event.event_type)) {
      sequence = [];
      continue;
    }
    if (["Corner", "FreeKick", "GoalKick", "PenaltyAwarded"].includes(event.event_type))
      sequence = [];
    if (sequence[sequence.length - 1]?.side !== event.side) sequence = [];
    if (sequence.length && event.minute - sequence[sequence.length - 1].minute > 3) sequence = [];
    if (["Substitution", "TacticalChange"].includes(event.event_type)) continue;
    if (
      ["Injury", "RedCard", "SecondYellow", "YellowCard", "ShootoutGoal", "ShootoutMiss"].includes(
        event.event_type,
      )
    )
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
      clips.push({
        id: (() => {
          const key = JSON.stringify([
            event.minute,
            event.side,
            event.event_type,
            event.player_id,
            event.secondary_player_id,
          ]);
          const occurrence = occurrences.get(key) ?? 0;
          occurrences.set(key, occurrence + 1);
          return `${key}:${occurrence}`;
        })(),
        events: [...sequence],
        outcome: event,
      });
      sequence = [];
    }
  }
  return clips;
}
