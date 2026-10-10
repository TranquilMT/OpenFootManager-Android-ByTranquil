import type { FixtureData } from "../../store/types";
import { calendarDay } from "../../lib/calendarDay";
export function fixtureCongestion(
  fixtures: FixtureData[],
  teamId: string,
  today: string,
  days = 14,
) {
  const day = calendarDay(today);
  const start = day ? Date.parse(day) : NaN;
  const seen = new Set<string>();
  const dates = fixtures
    .flatMap((fixture) => {
      const date = calendarDay(fixture.date);
      if (
        !teamId ||
        fixture.status !== "Scheduled" ||
        fixture.home_team_id === fixture.away_team_id ||
        !date ||
        seen.has(fixture.id) ||
        (fixture.home_team_id !== teamId && fixture.away_team_id !== teamId)
      )
        return [];
      const offset = (Date.parse(date) - start) / 86400000;
      if (!Number.isFinite(offset) || offset < 0 || offset > days) return [];
      seen.add(fixture.id);
      return [Date.parse(date)];
    })
    .sort((a, b) => a - b);
  const gaps = dates.slice(1).map((date, index) => (date - dates[index]) / 86400000);
  const minGap = gaps.length ? Math.min(...gaps) : null;
  return {
    count: dates.length,
    minGap,
    days,
    congested: minGap !== null && (minGap <= 3 || dates.length >= 4),
  };
}
