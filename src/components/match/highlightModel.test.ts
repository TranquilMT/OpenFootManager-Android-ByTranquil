import { expect, it } from "vitest";
import { buildMatchHighlights } from "./highlightModel";
import type { MatchEvent } from "./types";
export const event = (
  event_type: string,
  minute = 10,
  extra: Partial<MatchEvent> = {},
): MatchEvent => ({
  event_type,
  minute,
  side: "Home",
  zone: "AwayBox",
  player_id: "p1",
  secondary_player_id: null,
  ...extra,
});
it("replays recorded buildup before a goal", () => {
  const events = [event("PassCompleted", 9), event("Cross"), event("Goal")];
  expect(buildMatchHighlights(events, 10)[0].events).toEqual(events);
});
