import type { MatchEvent } from "./types";

export const EVENT_FILTERS = [
  { id: "all", key: "common.all" },
  { id: "goals", key: "match.eventTypes.Goal" },
  { id: "shots", key: "match.shots" },
  { id: "cards", key: "match.cards" },
  { id: "fouls", key: "match.fouls" },
  { id: "injuries", key: "match.eventTypes.Injury" },
  { id: "substitutions", key: "match.substitutions" },
  { id: "tactics", key: "match.tacticsTab" },
] as const;
export type EventFilter = (typeof EVENT_FILTERS)[number]["id"];
const TYPES: Record<Exclude<EventFilter, "all">, ReadonlySet<string>> = {
  goals: new Set(["Goal", "PenaltyGoal"]),
  shots: new Set([
    "ShotSaved",
    "ShotOnTarget",
    "ShotOffTarget",
    "ShotBlocked",
    "PenaltyMiss",
    "Goal",
    "PenaltyGoal",
  ]),
  cards: new Set(["YellowCard", "SecondYellow", "RedCard"]),
  fouls: new Set(["Foul"]),
  injuries: new Set(["Injury"]),
  substitutions: new Set(["Substitution"]),
  tactics: new Set(["TacticalChange"]),
};
export function filterMatchEvents(events: MatchEvent[], filter: EventFilter): MatchEvent[] {
  return filter === "all" ? events : events.filter((event) => TYPES[filter].has(event.event_type));
}
