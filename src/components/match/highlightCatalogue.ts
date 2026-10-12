import type { MatchHighlight } from "./highlightModel";
export type HighlightCategory = "all" | "goals" | "chances" | "incidents";
const TYPES = {
  goals: new Set(["Goal", "PenaltyGoal", "ShootoutGoal"]),
  chances: new Set([
    "Goal",
    "PenaltyGoal",
    "PenaltyMiss",
    "PenaltyAwarded",
    "ShotOnTarget",
    "ShotSaved",
    "ShotOffTarget",
    "ShotBlocked",
    "ShootoutGoal",
    "ShootoutMiss",
  ]),
  incidents: new Set(["YellowCard", "RedCard", "SecondYellow", "Injury"]),
};
export interface HighlightQuery {
  category?: HighlightCategory;
  side?: "all" | "Home" | "Away";
}
export function selectHighlights(clips: MatchHighlight[], query: HighlightQuery): MatchHighlight[] {
  return clips
    .filter(
      (clip) =>
        !query.category ||
        query.category === "all" ||
        TYPES[query.category].has(clip.outcome.event_type),
    )
    .filter((clip) => !query.side || query.side === "all" || clip.outcome.side === query.side);
}
