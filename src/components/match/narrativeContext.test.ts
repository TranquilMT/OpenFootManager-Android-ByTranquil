import { describe, expect, it } from "vitest";
import { eventContext, narrativeKey, matchMetrics } from "./narrativeContext";
import type { MatchEvent } from "./types";
const event = (
  type: string,
  minute: number,
  side: "Home" | "Away" = "Home",
  player = "p1",
): MatchEvent => ({
  event_type: type,
  minute,
  side,
  player_id: player,
  secondary_player_id: null,
  zone: "Midfield",
});
describe("truthful match narratives", () => {
  it("includes earlier goals stored after the current event", () => {
    const goal = event("Goal", 30);
    expect(eventContext(goal, [goal, event("Goal", 10, "Away")])).toMatchObject({
      opponentBefore: 1,
      ownAfter: 1,
      trailed: true,
    });
  });
  it("future goals cannot grant a current scorer milestone", () => {
    const goal = event("Goal", 30);
    expect(eventContext(goal, [event("Goal", 90), goal]).playerGoals).toBe(1);
  });
  it("unordered future goals cannot change the current score narrative", () => {
    const goal = event("Goal", 30);
    expect(eventContext(goal, [event("Goal", 90), goal]).ownBefore).toBe(0);
  });
  it("future injury records cannot explain an earlier substitution", () => {
    const injury = event("Injury", 60);
    const sub = { ...event("Substitution", 30), secondary_player_id: "p1" };
    expect(eventContext(sub, [injury, sub]).injuryChange).toBe(false);
  });
  it("does not read goals from the future", () => {
    const e = event("Goal", 10);
    expect(eventContext(e, [e, event("Goal", 50)]).ownAfter).toBe(1);
  });
  it("distinguishes goals in the same minute", () => {
    const a = event("Goal", 10);
    const b = event("Goal", 10, "Home", "p2");
    expect(eventContext(a, [a, b]).ownAfter).toBe(1);
  });
  it("accepts snapshot copies of an event", () => {
    const e = event("Goal", 10);
    expect(eventContext({ ...e }, [e, event("Goal", 20)]).ownAfter).toBe(1);
  });
  it("includes the current event when absent from snapshot", () => {
    const e = event("Goal", 10);
    expect(eventContext(e, []).ownAfter).toBe(1);
  });
  it("counts in-match penalties as goals", () => {
    const a = event("PenaltyGoal", 10);
    const b = event("Goal", 20);
    expect(eventContext(b, [a, b]).ownAfter).toBe(2);
  });
  it("excludes shootout kicks from the match score", () => {
    const a = event("ShootoutGoal", 10);
    const b = event("Goal", 20);
    expect(eventContext(b, [a, b]).ownAfter).toBe(1);
  });
  it("recognizes late equalisers", () => {
    const a = event("Goal", 10, "Away");
    const b = event("Goal", 88);
    expect(narrativeKey(b, [a, b])).toBe("lateEqualiser");
  });
  it("does not call an early equaliser late", () => {
    const a = event("Goal", 10, "Away");
    const b = event("Goal", 30);
    expect(narrativeKey(b, [a, b])).not.toBe("lateEqualiser");
  });
  it("recognizes a comeback lead", () => {
    const a = event("Goal", 10, "Away");
    const b = event("Goal", 30);
    const c = event("Goal", 60, "Home", "p2");
    expect(narrativeKey(c, [a, b, c])).toBe("comebackLead");
  });
  it("does not invent a comeback from a level match", () => {
    const e = event("Goal", 60);
    expect(narrativeKey(e, [e])).not.toBe("comebackLead");
  });
  it("describes a late lead without promising victory", () => {
    const e = event("Goal", 89);
    expect(narrativeKey(e, [e])).toBe("lateLead");
  });
  it("identifies a fourth goal milestone", () => {
    const events = [10, 20, 30, 40].map((m) => event("Goal", m));
    expect(narrativeKey(events[3], events)).toBe("fourGoals");
  });
  it("tracks milestones separately by scorer", () => {
    const a = event("Goal", 10);
    const b = event("Goal", 20, "Home", "p2");
    expect(eventContext(b, [a, b]).playerGoals).toBe(1);
  });
  it("records score from the away perspective", () => {
    const a = event("Goal", 10, "Home");
    const b = event("Goal", 20, "Away");
    expect(eventContext(b, [a, b]).opponentBefore).toBe(1);
  });
  it("counts rolling pressure only in its window", () => {
    const a = event("ShotSaved", 3);
    const b = event("Corner", 20);
    expect(eventContext(b, [a, b]).recentShots).toBe(0);
  });
  it("pressure never leaks between teams", () => {
    const a = event("ShotSaved", 19, "Away");
    const b = event("Corner", 20);
    expect(eventContext(b, [a, b]).recentShots).toBe(0);
  });
  it("recognizes late pressure from actual shots", () => {
    const events = [event("ShotSaved", 80), event("ShotBlocked", 81), event("Corner", 82)];
    expect(narrativeKey(events[2], events)).toBe("sustainedPressure");
  });
  it("identifies a first yellow without a prior booking", () => {
    const e = event("YellowCard", 20);
    expect(narrativeKey(e, [e])).toBe("bookingRisk");
  });
  it("identifies a dismissal without miscounting goals", () => {
    const e = event("RedCard", 20);
    expect(narrativeKey(e, [e])).toBe("numericalDisadvantage");
  });
  it("recognizes injury substitutions from recorded injuries", () => {
    const a = event("Injury", 40);
    const b = event("Substitution", 41, "Home", "p2");
    b.secondary_player_id = "p1";
    expect(narrativeKey(b, [a, b])).toBe("injuryChange");
  });
  it("does not invent an injury for a tactical substitution", () => {
    const e = event("Substitution", 65);
    e.secondary_player_id = "p2";
    expect(narrativeKey(e, [e])).toBe("freshLegs");
  });
  it("recognizes late protective changes only with a lead", () => {
    const a = event("Goal", 10);
    const b = event("Substitution", 85);
    expect(narrativeKey(b, [a, b])).toBe("protectLead");
  });
  it("keeps structural kickoff text neutral", () => {
    const e = event("KickOff", 0);
    expect(narrativeKey(e, [e])).toBeNull();
  });
  it("marks goalframe shots truthfully", () => {
    const e = event("ShotOffTarget", 20);
    e.detail = "Woodwork";
    expect(narrativeKey(e, [e])).toBe("woodwork");
  });
  it("xg totals omit shootout kicks", () => {
    const a = event("ShootoutGoal", 90);
    a.shot = { expected_goals: 0.8, goalkeeper_id: "gk" };
    expect(matchMetrics([a], "Home").xg).toBe(0);
  });
  it("xg totals are independent of finishing", () => {
    const a = event("ShotOffTarget", 10);
    a.shot = { expected_goals: 0.2, goalkeeper_id: "gk" };
    expect(matchMetrics([a], "Home").xg).toBeCloseTo(0.2);
  });
  it("legacy event logs have unavailable xg", () => {
    expect(matchMetrics([event("Goal", 10)], "Home").hasXg).toBe(false);
  });
  it("keeper saves belong to the defending team", () => {
    expect(matchMetrics([event("ShotSaved", 10, "Away")], "Home").saves).toBe(1);
  });
  it("woodwork counts once without an extra shot", () => {
    const e = event("ShotOffTarget", 10);
    e.detail = "Woodwork";
    expect(matchMetrics([e], "Home")).toMatchObject({ shots: 1, woodwork: 1 });
  });
  it("ignores malformed chance metadata", () => {
    const e = event("Goal", 10);
    e.shot = { expected_goals: NaN, goalkeeper_id: "gk" };
    expect(matchMetrics([e], "Home").xg).toBe(0);
  });

  it("does not assign a four-goal haul to unrecorded scorers", () => {
    const events = [10, 20, 30, 40].map((m) => ({ ...event("Goal", m), player_id: null }));
    expect(narrativeKey(events[3], events)).not.toBe("fourGoals");
  });

  it("ignores future-clock shots in imported event prefixes", () => {
    const shot = event("ShotSaved", 80);
    const corner = event("Corner", 70);
    expect(eventContext(corner, [shot, corner]).recentShots).toBe(0);
  });

  it("does not link an unattributed injury to an unspecified substitution", () => {
    const injury = { ...event("Injury", 30), player_id: null };
    const sub = event("Substitution", 31);
    expect(eventContext(sub, [injury, sub]).injuryChange).toBe(false);
  });

  it("matches a copied event to its recorded shot rather than another same-minute attempt", () => {
    const a = { ...event("ShotSaved", 30), shot: { expected_goals: 0.1, goalkeeper_id: "gk" } };
    const b = { ...a, shot: { expected_goals: 0.5, goalkeeper_id: "gk" } };
    expect(eventContext({ ...b }, [a, b]).recentShots).toBe(1);
  });
});
