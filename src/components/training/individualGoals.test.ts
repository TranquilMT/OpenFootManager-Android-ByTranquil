import { describe, expect, it } from "vitest";
import { createGameState } from "../../pages/dashboardTestFixture";
import { individualMonthlyGoal } from "./individualGoals";

describe("individual monthly training goal", () => {
  it("uses a saved focus and review baseline to measure a real rating target", () => {
    const player = {
      ...createGameState().players[0],
      training_focus: "Technical",
      ovr: 68,
      potential: 80,
      development_history: [
        { date: "2026-08-01", season: 2026, ovr: 67, minutes_played: 0, focus: "Technical" },
      ],
    };
    expect(individualMonthlyGoal(player)).toMatchObject({
      target: 68,
      progress: 100,
      status: "complete",
    });
    expect(individualMonthlyGoal({ ...player, ovr: 67 })).toMatchObject({
      progress: 0,
      status: "ongoing",
    });
  });
  it("does not credit gains to a newly changed plan or set targets beyond potential", () => {
    const player = {
      ...createGameState().players[0],
      training_focus: "Technical",
      ovr: 68,
      potential: 68,
      development_history: [
        { date: "2026-08-01", season: 2026, ovr: 68, minutes_played: 0, focus: "Physical" },
      ],
    };
    expect(individualMonthlyGoal(player).status).toBe("new");
    expect(individualMonthlyGoal({ ...player, training_focus: "Physical" }).status).toBe("ceiling");
  });

  it("uses the newest review when stored history is out of order", () => {
    const player = { ...createGameState().players[0], ovr: 70, potential: 80,
      training_focus: "Technical", development_history: [
        { date: "2026-09-01", season: 2026, ovr: 70, minutes_played: 100, focus: "Technical" },
        { date: "2026-08-01", season: 2026, ovr: 67, minutes_played: 0, focus: "Technical" },
      ] };
    expect(individualMonthlyGoal(player)).toMatchObject({date: "2026-09-01", target: 71, progress: 0});
  });



  it("starts a changed focus target from current ability", () => {
    const player = { ...createGameState().players[0], ovr: 73, potential: 80,
      training_focus: "Technical", development_history: [
        { date: "2026-08-01", season: 2026, ovr: 67, minutes_played: 0, focus: "Physical" },
      ] };
    expect(individualMonthlyGoal(player)).toMatchObject({target: 74, status: "new", progress: 0});
  });



  it("finishes a partial rating target at the potential ceiling", () => {
    const player = { ...createGameState().players[0], ovr: 68, potential: 68,
      training_focus: "Technical", development_history: [
        { date: "2026-08-01", season: 2026, ovr: 67.5, minutes_played: 0, focus: "Technical" },
      ] };
    expect(individualMonthlyGoal(player)).toMatchObject({target: 68, progress: 100, status: "complete"});
  });



  it("does not set a target beyond the maximum rating", () => {
    const player = { ...createGameState().players[0], ovr: 99, potential: 120, training_focus: "Technical" };
    expect(individualMonthlyGoal(player).target).toBe(99);
  });


});
