import { describe, expect, it } from "vitest";
import { createGameState } from "../../pages/dashboardTestFixture";
import { projectClubCash } from "./financeForecast";

describe("cash and committed wage forecast", () => {
  it("includes agreed registrations on their dates and ignores unaccepted offers", () => {
    const base = createGameState().players[0];
    const offer = {
      id: "pending",
      from_team_id: "team-1",
      fee: 10000,
      wage_offered: 52000,
      last_manager_fee: null,
      negotiation_round: 0,
      suggested_counter_fee: null,
      status: "PendingRegistration" as const,
      date: "2026-08-01",
      registration_date: "2026-08-08",
    };
    const player = {
      ...base,
      team_id: "seller",
      transfer_offers: [offer, { ...offer, id: "unaccepted", status: "Pending" as const }],
    };
    const forecast = projectClubCash({
      cash: 100000,
      weeklyNet: -1000,
      weeklyWages: 5000,
      teamId: "team-1",
      today: "2026-08-01",
      weeks: 4,
      players: [player],
    });
    expect(forecast.cash).toBe(83000);
    expect(forecast.weeklyWages).toBe(6000);
  });
  it("does not debit registrations beyond the selected horizon", () => {
    const base = createGameState().players[0];
    const loan = {
      id: "loan",
      from_team_id: "team-1",
      parent_team_id: "seller",
      start_date: "2026-12-01",
      end_date: "2027-06-01",
      wage_contribution_pct: 50,
      status: "PendingRegistration" as const,
      date: "2026-08-01",
    };
    expect(
      projectClubCash({
        cash: 10000,
        weeklyNet: -100,
        weeklyWages: 1000,
        teamId: "team-1",
        today: "2026-08-01",
        weeks: 4,
        players: [{ ...base, loan_offers: [loan] }],
      }),
    ).toEqual({ cash: 9600, weeklyWages: 1000, transferNet: 0 });
  });
  it("stops paying owned players after known contract expiry", () => {
    const player = { ...createGameState().players[0], team_id: "team-1", wage: 52000, contract_end: "2026-08-08", transfer_offers: [] };
    expect(projectClubCash({ cash: 100000, weeklyNet: -1000, weeklyWages: 1000, teamId: "team-1", today: "2026-08-01", weeks: 4, players: [player] })).toEqual({ cash: 99000, weeklyWages: 0, transferNet: 0 });
  });
  it("restores outgoing loan wages and releases incoming loan wages on return", () => {
    const player = { ...createGameState().players[0], team_id: "other", wage: 52000, transfer_offers: [], active_loan: { parent_team_id: "team-1", loan_team_id: "other", start_date: "2026-07-01", end_date: "2026-08-08", wage_contribution_pct: 60 } };
    const common = { cash: 100000, today: "2026-08-01", weeks: 4, players: [player] };
    expect(projectClubCash({ ...common, weeklyNet: -400, weeklyWages: 400, teamId: "team-1" })).toMatchObject({ cash: 96600, weeklyWages: 1000 });
    expect(projectClubCash({ ...common, weeklyNet: -600, weeklyWages: 600, teamId: "other" })).toMatchObject({ cash: 99400, weeklyWages: 0 });
  });
});
