import { describe, expect, it } from "vitest";
import { eventContext, narrativeKey, matchMetrics } from "./narrativeContext";
import type { MatchEvent } from "./types";
const event = (type: string, minute: number, side: "Home" | "Away" = "Home", player = "p1"): MatchEvent => ({ event_type: type, minute, side, player_id: player, secondary_player_id: null, zone: "Midfield" });
describe("truthful match narratives", () => {
  it("does not read goals from the future", () => { const e = event("Goal", 10); expect(eventContext(e, [e, event("Goal", 50)]).ownAfter).toBe(1); });
  it("distinguishes goals in the same minute", () => { const a = event("Goal", 10); const b = event("Goal", 10, "Home", "p2"); expect(eventContext(a, [a,b]).ownAfter).toBe(1); });
  it("accepts snapshot copies of an event", () => { const e = event("Goal", 10); expect(eventContext({...e}, [e, event("Goal", 20)]).ownAfter).toBe(1); });
  it("includes the current event when absent from snapshot", () => { const e = event("Goal", 10); expect(eventContext(e, []).ownAfter).toBe(1); });
  it("counts in-match penalties as goals", () => { const a = event("PenaltyGoal", 10); const b = event("Goal", 20); expect(eventContext(b,[a,b]).ownAfter).toBe(2); });
  it("excludes shootout kicks from the match score", () => { const a = event("ShootoutGoal", 10); const b = event("Goal",20); expect(eventContext(b,[a,b]).ownAfter).toBe(1); });
  it("recognizes late equalisers", () => { const a=event("Goal",10,"Away"); const b=event("Goal",88); expect(narrativeKey(b,[a,b])).toBe("lateEqualiser"); });
  it("does not call an early equaliser late", () => { const a=event("Goal",10,"Away"); const b=event("Goal",30); expect(narrativeKey(b,[a,b])).not.toBe("lateEqualiser"); });
});
