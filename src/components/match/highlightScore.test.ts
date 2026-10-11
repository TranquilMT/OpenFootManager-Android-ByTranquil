import { expect, it } from "vitest";
import { highlightScore } from "./highlightScore";
import type { MatchEvent } from "./types";
const event = (event_type: string, minute: number, side: "Home" | "Away" = "Home") =>
  ({ event_type, minute, side }) as MatchEvent;
it("reconstructs only regulation goals reached in a replay frame", () => {
  const events = [
    event("KickOff", 0),
    event("Goal", 10),
    event("PenaltyGoal", 20, "Away"),
    event("ShootoutGoal", 125),
  ];
  expect(highlightScore(events, events[1])).toEqual({ home: 1, away: 0 });
  expect(highlightScore(events, events[3])).toEqual({ home: 1, away: 1 });
});
it("does not invent a score for incomplete imported histories", () => {
  const goal = event("Goal", 10);
  expect(highlightScore([goal], goal)).toBeNull();
  expect(highlightScore([event("KickOff", 0)], goal)).toBeNull();
});
