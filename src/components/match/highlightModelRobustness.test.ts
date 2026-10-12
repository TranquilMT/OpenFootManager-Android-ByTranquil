import { expect, it } from "vitest";
import { buildMatchHighlights } from "./highlightModel";
import type { MatchEvent } from "./types";
const event = (event_type: string, minute = 10, extra: Record<string, unknown> = {}): MatchEvent =>
  ({
    event_type,
    minute,
    side: "Home",
    zone: "AwayBox",
    player_id: "p1",
    secondary_player_id: null,
    ...extra,
  }) as MatchEvent;
it("rejects invalid team identities and resets their buildup", () => {
  const goal = event("Goal", 12);
  const clips = buildMatchHighlights(
    [event("PassCompleted"), event("Goal", 11, { side: "Neutral" }), goal],
    12,
  );
  expect(clips).toHaveLength(1);
  expect(clips[0].events).toEqual([goal]);
});
