import type { PlayerData } from "../../store/types";
import { getPlayerOvr } from "../../lib/helpers";

export function developmentReport(player: PlayerData, season: number) {
  const history = player.development_history ?? [];
  const baseline = history[history.length - 1];
  return {
    date: baseline?.date ?? null,
    growth: baseline ? getPlayerOvr(player) - baseline.ovr : null,
    minutes: baseline
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
