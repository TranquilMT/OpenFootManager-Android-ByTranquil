import { expect, it } from "vitest";
import { computeGoalSources } from "./goalSources";
import type { MatchEvent } from "./types";
it("keeps set-piece attribution consistent with recorded highlight outcomes", () => {
  const events = [
    { event_type: "Corner", side: "Home" },
    { event_type: "Goal", side: "Away" },
    { event_type: "PenaltyGoal", side: "Home" },
  ] as MatchEvent[];
  expect(computeGoalSources(events, "Away")).toEqual({
    openPlay: 1,
    corners: 0,
    freekicks: 0,
    penalties: 0,
  });
  expect(computeGoalSources(events, "Home")).toEqual({
    openPlay: 0,
    corners: 0,
    freekicks: 0,
    penalties: 1,
  });
});
