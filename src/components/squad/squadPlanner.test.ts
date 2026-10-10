import { describe, expect, it } from "vitest";
import { createGameState } from "../../pages/dashboardTestFixture";
import { buildSquadPlan } from "./squadPlanner";

describe("six-month squad plan", () => {
  it("shows expiring seniors and excludes retired players and academy contracts", () => {
    const base = createGameState().players[0];
    const players = [
      { ...base, id: "expiring", contract_end: "2026-10-15" },
      { ...base, id: "retired", retired: true },
      { ...base, id: "youth", squad_role: "Youth" as const },
      { ...base, id: "long", contract_end: "2028-01-01" },
    ];
    const plan = buildSquadPlan(players, "4-4-2", "2026-07-10");
    expect(plan.expiring.map((player) => player.id)).toEqual(["expiring"]);
    expect(plan.projectedCount).toBe(1);
    expect(plan.coverage.some((role) => role.status === "uncovered")).toBe(true);
  });
  it("retains contracts with unknown expiry and does not treat injuries as departures", () => {
    const base = createGameState().players[0];
    const plan = buildSquadPlan(
      [{ ...base, contract_end: null, injury: { name: "test", days_remaining: 5 } }],
      "4-4-2",
      "2026-07-10",
    );
    expect(plan.projectedCount).toBe(1);
    expect(plan.expiring).toHaveLength(0);
  });

 it("does not count mirrored player records as extra squad depth",()=>{
  const base={...createGameState().players[0],contract_end:"2028-01-01"};
  expect(buildSquadPlan([base,{...base}],"4-4-2","2026-07-10").projectedCount).toBe(1);
 });



 it("does not treat a short injury as missing goalkeeper cover six months later",()=>{
  const base=createGameState().players[0];
  const player={...base,position:"Goalkeeper",natural_position:"Goalkeeper",contract_end:"2028-01-01",injury:{name:"test",days_remaining:5}};
  const healthy=buildSquadPlan([{...player,injury:null}],"4-4-2","2026-07-10");
  const injured=buildSquadPlan([player],"4-4-2","2026-07-10");
  expect(injured.coverage).toEqual(healthy.coverage);
  expect(player.injury?.days_remaining).toBe(5);
 });



 it("removes incoming loans due to return within the planning horizon",()=>{
  const base={...createGameState().players[0],contract_end:"2028-01-01"};
  const loan={parent_team_id:"parent",loan_team_id:base.team_id!,start_date:"2026-07-01",end_date:"2026-09-01",wage_contribution_pct:100};
  const plan=buildSquadPlan([{...base,active_loan:loan}],"4-4-2","2026-07-10");
  expect(plan.projectedCount).toBe(0);
  expect(plan.returningLoans.map(player=>player.id)).toEqual([base.id]);
 });



 it("separates loan returns from parent-club contract expiry",()=>{
  const base={...createGameState().players[0],contract_end:"2026-09-01"};
  const player={...base,active_loan:{parent_team_id:"parent",loan_team_id:base.team_id!,start_date:"2026-07-01",end_date:"2026-09-01",wage_contribution_pct:100}};
  const plan=buildSquadPlan([player],"4-4-2","2026-07-10");
  expect(plan.expiring).toEqual([]);
  expect(plan.returningLoans).toHaveLength(1);
 });


});
