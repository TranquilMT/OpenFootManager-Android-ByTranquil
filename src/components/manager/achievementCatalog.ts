import type { ManagerCareerStats } from "../../store/types";

export const ACHIEVEMENTS = [
  { id: "debut", xp: 50 },
  { id: "first_win", xp: 100 },
  { id: "ten_wins", xp: 150 },
  { id: "fifty_matches", xp: 200 },
  { id: "trophy", xp: 300 },
  { id: "promotion", xp: 250 },
  { id: "board_goal", xp: 150 },
  { id: "player_development", xp: 150 },
  { id: "academy_minutes", xp: 200 },
  { id: "career_year", xp: 150 },
] as const;

export function managerProgress(stats: ManagerCareerStats) {
  const unlocked = stats.progression?.unlocked ?? [];
  const xp = ACHIEVEMENTS.reduce(
    (total, achievement) =>
      total + (unlocked.some((entry) => entry.id === achievement.id) ? achievement.xp : 0),
    0,
  );
  const level = Math.min(6, 1 + Math.floor(xp / 300));
  return {
    xp,
    level,
    training: (level - 1) * 2,
    performance: Math.min(2, Math.floor((level - 1) / 2)),
    next: level < 6 ? level * 300 : null,
    unlocked,
  };
}
