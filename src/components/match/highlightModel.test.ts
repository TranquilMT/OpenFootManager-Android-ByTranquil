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
it("excludes future and malformed event clocks without mutating history", () => {
  const events = [event("Goal", 40), event("Goal", 10), event("Goal", -1), event("Goal", NaN)];
  expect(buildMatchHighlights(events, 20).map((clip) => clip.outcome.minute)).toEqual([10]);
  expect(events[0].minute).toBe(40);
});
it("includes major discipline, injuries and recorded exceptional chances", () => {
  for (const outcome of [
    event("RedCard"),
    event("SecondYellow"),
    event("Injury"),
    event("PenaltyAwarded"),
    event("PenaltyMiss"),
    event("ShotOffTarget", 10, { detail: "Woodwork" }),
    event("ShotSaved", 10, { detail: { Save: { quality: "WorldClass" } } }),
    event("ShotBlocked", 10, { detail: { Shot: { danger: "BigChance" } } }),
  ]) {
    expect(buildMatchHighlights([outcome], 10)).toHaveLength(1);
  }
});
it("offers extended chances while keeping routine shots out of key mode", () => {
  const events = [
    event("ShotSaved"),
    event("ShotOffTarget", 11),
    event("ShotBlocked", 12),
    event("YellowCard", 13),
  ];
  expect(buildMatchHighlights(events, 20, "key")).toHaveLength(0);
  expect(buildMatchHighlights(events, 20, "extended")).toHaveLength(4);
});
it("starts a new buildup when possession changes sides", () => {
  const away = event("PassCompleted", 9, { side: "Away" });
  const home = event("PassCompleted", 10);
  expect(buildMatchHighlights([away, home, event("Goal", 11)], 11)[0].events).toEqual([
    home,
    event("Goal", 11),
  ]);
});
it("separates restarts and never replays actions across a half", () => {
  const goal = event("Goal", 48),
    corner = event("Corner", 48);
  expect(
    buildMatchHighlights([event("PassCompleted", 47), event("HalfTime", 48), goal], 48)[0].events,
  ).toEqual([goal]);
  expect(buildMatchHighlights([event("PassCompleted", 47), corner, goal], 48)[0].events).toEqual([
    corner,
    goal,
  ]);
});
