import { expect, it } from "vitest";
import { highlightSnapshot } from "./highlightSnapshot";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
it("gives commentary the score and history at the replayed action", () => {
  const events = [
    { event_type: "KickOff", minute: 0 },
    { event_type: "Goal", minute: 10, side: "Home" },
    { event_type: "Goal", minute: 20, side: "Away" },
  ] as MatchEvent[];
  const snapshot = {
    ...createSnapshot(),
    home_score: 3,
    away_score: 2,
    current_minute: 90,
    events,
  };
  const replay = highlightSnapshot(snapshot, events[1]);
  expect(replay.home_score).toBe(1);
  expect(replay.away_score).toBe(0);
  expect(replay.events).toEqual(events.slice(0, 2));
  expect(replay.current_minute).toBe(10);
  expect(snapshot.home_score).toBe(3);
});
