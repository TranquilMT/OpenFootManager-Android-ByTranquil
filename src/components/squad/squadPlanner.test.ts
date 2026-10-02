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
});
