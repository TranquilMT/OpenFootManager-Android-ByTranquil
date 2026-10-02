import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, managerProgress } from "./achievementCatalog";
import type { ManagerCareerStats } from "../../store/types";
const stats: ManagerCareerStats = {
  matches_managed: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  trophies: 0,
  best_finish: null,
};
describe("manager achievement progression", () => {
  it("opens legacy careers at level one without UI-generated rewards", () => {
    expect(managerProgress({ ...stats, wins: 100 })).toMatchObject({
      xp: 0,
      level: 1,
      training: 0,
      performance: 0,
    });
  });
  it("counts known saved achievements once and caps benefits", () => {
    const unlocked = ACHIEVEMENTS.map(({ id }) => ({ id, date: "2026-09-01" }));
    expect(
      managerProgress({
        ...stats,
        progression: { unlocked: [...unlocked, ...unlocked, { id: "unknown", date: "" }] },
      }),
    ).toMatchObject({ xp: 1700, level: 6, training: 10, performance: 2, next: null });
  });
});
