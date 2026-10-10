import { describe, expect, it } from "vitest";
import type { EnginePlayerData, MatchSnapshot, MatchEvent } from "./types";
import { playerMatchRatings } from "./playerRatings";
const player = (id: string) => ({ id, name: id, position: "Midfielder" }) as EnginePlayerData;
const event = (
  event_type: string,
  player_id = "starter",
  secondary_player_id: string | null = null,
  side: "Home" | "Away" = "Home",
  minute = 20,
): MatchEvent => ({ event_type, player_id, secondary_player_id, side, minute, zone: "Midfield" });
const snapshot = (events: MatchEvent[] = []) =>
  ({
    phase: "Finished",
    current_minute: 90,
    home_score: 0,
    away_score: 0,
    home_team: { players: [player("replacement"), player("keeper")] },
    away_team: { players: [] },
    home_bench: [player("starter"), player("unused")],
    away_bench: [],
    sent_off: [],
    events,
    substitutions: [
      { side: "Home", minute: 60, player_off_id: "starter", player_on_id: "replacement" },
    ],
  }) as unknown as MatchSnapshot;
describe("recorded post-match player ratings", () => {
  it("keeps imported tackle records consistent with player statistics", () => {
    expect(
      playerMatchRatings(snapshot([event("TackleWon")]), "Home").find((row) => row.id === "starter")
        ?.rating,
    ).toBe(6.2);
  });
  it("credits a decided shootout win without counting shootout goals", () => {
    const snap = snapshot([event("ShootoutGoal", "starter")]);
    snap.penalty_shootout = { home_scored: 5, away_scored: 4 } as NonNullable<
      MatchSnapshot["penalty_shootout"]
    >;
    expect(playerMatchRatings(snap, "Home").find((row) => row.id === "starter")?.rating).toBe(6.5);
  });
  it("keeps a heavily penalised rating at its floor instead of resetting zero", () => {
    const events = Array.from({ length: 13 }, () => event("YellowCard"));
    expect(
      playerMatchRatings(snapshot(events), "Home").find((row) => row.id === "starter")?.rating,
    ).toBe(1);
  });
  it("rating ties use stable identities rather than snapshot roster order", () => {
    const first = snapshot();
    const second = {
      ...first,
      home_team: { ...first.home_team, players: [...first.home_team.players].reverse() },
    };
    expect(playerMatchRatings(first, "Home").map((row) => row.id)).toEqual(
      playerMatchRatings(second, "Home").map((row) => row.id),
    );
  });
  it("future records cannot increase report ratings", () => {
    expect(
      playerMatchRatings(snapshot([event("Goal", "starter", null, "Home", 100)]), "Home").find(
        (row) => row.id === "starter",
      )?.rating,
    ).toBe(6);
  });
  it("second yellows include the dismissal consequence", () => {
    expect(
      playerMatchRatings(snapshot([event("SecondYellow")]), "Home").find(
        (row) => row.id === "starter",
      )?.rating,
    ).toBe(4);
  });
  it("recorded opposition saves credit the goalkeeper rating", () => {
    const save = {
      ...event("ShotSaved", "opponent", "keeper", "Away"),
      shot: { expected_goals: 0.3, goalkeeper_id: "keeper" },
    };
    expect(
      playerMatchRatings(snapshot([save]), "Home").find((row) => row.id === "keeper")?.rating,
    ).toBe(6.2);
  });
  it("penalty goals cannot award an assist bonus", () => {
    expect(
      playerMatchRatings(snapshot([event("PenaltyGoal", "starter", "keeper")]), "Home").find(
        (row) => row.id === "keeper",
      )?.rating,
    ).toBe(6);
  });
  it("a scorer cannot receive an assist bonus for their own goal", () => {
    expect(
      playerMatchRatings(snapshot([event("Goal", "starter", "starter")]), "Home").find(
        (row) => row.id === "starter",
      )?.rating,
    ).toBe(7.2);
  });
  it("includes replaced participants but excludes unused reserves", () => {
    expect(
      playerMatchRatings(snapshot(), "Home")
        .map((row) => row.id)
        .sort(),
    ).toEqual(["keeper", "replacement", "starter"]);
  });
});
