import { describe, expect, it } from "vitest";
import { createGameState } from "../../pages/dashboardTestFixture";
import { developmentReport } from "./developmentReport";

describe("academy development report", () => {
  it("measures actual ability and playing-time progress since the last review", () => {
    const player = {
      ...createGameState().players[0],
      ovr: 70,
      potential: 80,
      stats: { ...createGameState().players[0].stats, minutes_played: 600 },
      development_history: [
        { date: "2026-08-01", season: 2026, ovr: 67, minutes_played: 400, focus: null },
      ],
    };
    expect(developmentReport(player, 2026)).toMatchObject({
      growth: 3,
      minutes: 200,
      readiness: "ready",
    });
    expect(developmentReport({ ...player, ovr: 50 }, 2026).readiness).toBe("developing");
  });
  it("treats season resets correctly and leaves missing history unknown", () => {
    const player = createGameState().players[0];
    expect(developmentReport(player, 2026).growth).toBeNull();
    expect(
      developmentReport(
        {
          ...player,
          stats: { ...player.stats, minutes_played: 30 },
          development_history: [
            { date: "2025-06-01", season: 2025, ovr: 67, minutes_played: 900, focus: null },
          ],
        },
        2026,
      ).minutes,
    ).toBe(30);
  });
});
