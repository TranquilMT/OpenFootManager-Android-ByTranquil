import type { PlayerData } from "../../store/types";
import { getPlayerOvr } from "../../lib/helpers";
import { latestDevelopmentReview } from "../../lib/developmentHistory";

export function developmentReport(player: PlayerData, season: number) {
  const history = player.development_history ?? [];
  const baseline = latestDevelopmentReview(history.filter((review) => review.season <= season));
  return {
    date: baseline?.date ?? null,
    growth: baseline ? getPlayerOvr(player) - baseline.ovr : null,
    minutes: baseline && Number.isFinite(player.stats.minutes_played)
      && player.stats.minutes_played >= 0
      && (baseline.season !== season || (Number.isFinite(baseline.minutes_played) && baseline.minutes_played >= 0))
      ? baseline.season !== season
        ? player.stats.minutes_played
        : Math.max(0, player.stats.minutes_played - baseline.minutes_played)
      : null,
    readiness:
      getPlayerOvr(player) >= 68 && (player.potential ?? 0) >= 78
        ? ("ready" as const)
        : ("developing" as const),
  };
}
