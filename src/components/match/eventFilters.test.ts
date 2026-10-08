import { describe, expect, it } from "vitest";
import { filterMatchEvents } from "./eventFilters";
import type { MatchEvent } from "./types";

const events = [
  "Goal",
  "PenaltyGoal",
  "ShootoutGoal",
  "YellowCard",
  "SecondYellow",
  "RedCard",
  "Injury",
  "Substitution",
  "TacticalChange",
].map(
  (event_type, minute) =>
    ({
      event_type,
      minute,
      side: "Home",
      zone: "HomeBox",
      player_id: null,
      secondary_player_id: null,
    }) as MatchEvent,
);
describe("match event filters", () => {
  it("separates match goals from shootout kicks and retains chronological order", () => {
    expect(filterMatchEvents(events, "goals").map((event) => event.event_type)).toEqual([
      "Goal",
      "PenaltyGoal",
    ]);
  });
  it("includes second-yellow dismissals in the discipline filter", () => {
    expect(filterMatchEvents(events, "cards").map((event) => event.event_type)).toEqual([
      "YellowCard",
      "SecondYellow",
      "RedCard",
    ]);
  });
  it("filters decisions without altering the source event log", () => {
    expect(filterMatchEvents(events, "injuries")).toHaveLength(1);
    expect(filterMatchEvents(events, "substitutions")).toHaveLength(1);
    expect(filterMatchEvents(events, "tactics")).toHaveLength(1);
    expect(filterMatchEvents(events, "all")).toEqual(events);
    expect(events).toHaveLength(9);
  });
});
