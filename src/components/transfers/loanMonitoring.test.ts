import { describe, expect, it } from "vitest";
import { createGameState } from "../../pages/dashboardTestFixture";
import { monitoredLoans } from "./loanMonitoring";

describe("club loan monitoring", () => {
  it("includes outgoing and incoming loans and subtracts the start-of-loan stats", () => {
    const base = createGameState().players[0];
    const loan = {
      parent_team_id: "team-1",
      loan_team_id: "other",
      start_date: "2026-08-01",
      end_date: "2027-06-01",
      wage_contribution_pct: 50,
      loan_start_minutes: 90,
      loan_start_appearances: 1,
    };
    const players = [
      {
        ...base,
        id: "out",
        team_id: "other",
        active_loan: loan,
        stats: { ...base.stats, appearances: 4, minutes_played: 300 },
      },
      { ...base, id: "foreign", active_loan: { ...loan, parent_team_id: "foreign" } },
      { ...base, id: "retired", retired: true, active_loan: loan },
    ];
    expect(
      monitoredLoans(players, "team-1").map((row) => [row.player.id, row.appearances, row.minutes]),
    ).toEqual([["out", 3, 210]]);
  });
  it("does not attribute unrelated career totals to legacy loans without start counters", () => {
    const base = createGameState().players[0];
    const loan = {
      parent_team_id: "other",
      loan_team_id: "team-1",
      start_date: "2026-08-01",
      end_date: "2027-06-01",
      wage_contribution_pct: 100,
    };
    expect(
      monitoredLoans(
        [
          {
            ...base,
            active_loan: loan,
            stats: { ...base.stats, minutes_played: 35, appearances: 1 },
          },
        ],
        "team-1",
      )[0],
    ).toMatchObject({ minutes: 0, appearances: 0, hasBaseline: false });
  });
});
