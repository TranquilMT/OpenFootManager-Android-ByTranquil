import type { FixtureData } from "../../store/types";

type PromiseFixture = Pick<FixtureData, "id" | "date" | "home_team_id" | "away_team_id" | "status">;

/** Projection only: injury pauses and rescheduled fixtures may move this date. */
export function expectedPromiseDeadline(
  fixtures: PromiseFixture[],
  teamId: string,
  today: string,
  matchesRemaining: number,
  injured: boolean,
): string | null {
  if (injured || matchesRemaining < 1) return null;
  const scheduled = Array.from(
    new Map(
      fixtures
        .filter(
          (fixture) =>
            fixture.status === "Scheduled" &&
            fixture.date >= today &&
            (fixture.home_team_id === teamId || fixture.away_team_id === teamId),
        )
        .map((fixture) => [fixture.id, fixture]),
    ).values(),
  ).sort((a, b) => a.date.localeCompare(b.date));
  return scheduled[matchesRemaining - 1]?.date ?? null;
}
