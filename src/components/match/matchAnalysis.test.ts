import { describe, expect, it } from "vitest";
import { analyzeMatch } from "./matchAnalysis";
import type { MatchEvent } from "./types";
const event = (
  event_type: string,
  minute: number,
  side: "Home" | "Away" = "Home",
  xg?: number,
): MatchEvent => ({
  event_type,
  minute,
  side,
  zone: "Midfield",
  player_id: "p",
  secondary_player_id: null,
  shot: xg === undefined ? null : { expected_goals: xg, goalkeeper_id: "gk" },
});
describe("match analysis", () => {
  it("excludes future events, malformed values and shootout kicks", () => {
    const result = analyzeMatch(
      [
        event("Goal", 12, "Home", 0.4),
        event("ShootoutGoal", 120, "Home", 1),
        event("ShotSaved", 91, "Home", 0.5),
        event("ShotSaved", NaN),
        event("ShotSaved", 20, "Home", NaN),
      ],
      "Home",
      90,
    );
    expect(result.metrics.shots).toBe(2);
    expect(result.bigChances).toBe(1);
    expect(result.recordedShots).toBe(1);
    expect(result.metrics.xg).toBeCloseTo(0.4);
  });
  it("uses event order for same-minute substitution effects", () => {
    const result = analyzeMatch(
      [
        event("Goal", 60, "Home", 0.3),
        event("Substitution", 60),
        event("ShotSaved", 60, "Home", 0.2),
        event("Goal", 70, "Away", 0.4),
      ],
      "Home",
      90,
    );
    expect(result.afterSubstitution?.shots).toBe(1);
    expect(result.afterSubstitution?.conceded).toBe(1);
  });
  it("counts goalkeeper saves for the defending side", () => {
    expect(analyzeMatch([event("ShotSaved", 3, "Away", 0.2)], "Home", 90).metrics.saves).toBe(1);
  });
  it("does not invent big chances from legacy shots without metadata", () => {
    const result = analyzeMatch([event("Goal", 12)], "Home", 90);
    expect(result.bigChances).toBe(0);
    expect(result.recordedShots).toBe(0);
    expect(result.metrics.hasXg).toBe(false);
  });
});
