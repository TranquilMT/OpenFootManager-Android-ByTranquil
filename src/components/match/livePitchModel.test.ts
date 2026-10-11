import { describe, expect, it } from "vitest";
import { buildLivePitchPlayers, ballZonePosition, reachedMatchEvents } from "./livePitchModel";
import type { EnginePlayerData, EngineTeamData, MatchEvent } from "./types";
const players = Array.from(
  { length: 11 },
  (_, i) =>
    ({
      id: `p${i}`,
      name: `Player ${i}`,
      position: i === 0 ? "Goalkeeper" : "Midfielder",
    }) as EnginePlayerData,
);
const team: EngineTeamData = {
  id: "h",
  name: "Home",
  formation: "4-4-2",
  play_style: "Balanced",
  players,
};
describe("live pitch model", () => {
  it("places two complete lineups on opposing halves", () => {
    const home = buildLivePitchPlayers(team, "Home", []);
    const away = buildLivePitchPlayers(team, "Away", []);
    expect(home).toHaveLength(11);
    expect(away).toHaveLength(11);
    expect(home.every((p) => p.x < 50)).toBe(true);
    expect(away.every((p) => p.x > 50)).toBe(true);
    expect(home[0].x).toBeLessThan(home[10].x);
    expect(away[0].x).toBeGreaterThan(away[10].x);
  });
  it("preserves slot identity when a player is dismissed", () => {
    const before = buildLivePitchPlayers(team, "Home", []);
    const after = buildLivePitchPlayers(team, "Home", ["p3"]);
    expect(after).toHaveLength(10);
    expect(after.find((p) => p.player.id === "p4")).toEqual(
      before.find((p) => p.player.id === "p4"),
    );
  });
  it("maps recorded ball zones without inventing an unknown location", () => {
    expect(ballZonePosition("HomeBox")).toBe(8);
    expect(ballZonePosition("AwayBox")).toBe(92);
    expect(ballZonePosition("unknown")).toBeNull();
  });
  it("rejects inherited object names as unknown ball zones", () => {
    expect(ballZonePosition("toString")).toBeNull();
    expect(ballZonePosition("constructor")).toBeNull();
    expect(ballZonePosition("__proto__")).toBeNull();
  });
  it("excludes future and malformed events and keeps same-minute order", () => {
    const events = [22, 0, 23, NaN, -1, 22].map(
      (minute, i) => ({ minute, player_id: String(i) }) as MatchEvent,
    );
    expect(reachedMatchEvents(events, 22).map((e) => e.player_id)).toEqual(["1", "0", "5"]);
    expect(events[0].minute).toBe(22);
  });
});
