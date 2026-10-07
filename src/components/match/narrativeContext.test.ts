import { describe, expect, it } from "vitest";
import { eventContext, narrativeKey, matchMetrics } from "./narrativeContext";
import type { MatchEvent } from "./types";
const event = (type: string, minute: number, side: "Home" | "Away" = "Home", player = "p1"): MatchEvent => ({ event_type: type, minute, side, player_id: player, secondary_player_id: null, zone: "Midfield" });
describe("truthful match narratives", () => {
  it("does not read goals from the future", () => { const e = event("Goal", 10); expect(eventContext(e, [e, event("Goal", 50)]).ownAfter).toBe(1); });
});
