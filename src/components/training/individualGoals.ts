import type { PlayerData } from "../../store/types";
import { getPlayerOvr } from "../../lib/helpers";
import { latestDevelopmentReview } from "../../lib/developmentHistory";

export function individualMonthlyGoal(player: PlayerData) {
  const history = player.development_history ?? [];
  const baseline = latestDevelopmentReview(history);
  const current = getPlayerOvr(player);
  const ceiling = player.potential && player.potential > 0 ? player.potential : 99;
  const target = Math.min(ceiling, (baseline?.ovr ?? current) + 1);
  const isNew = !baseline || baseline.focus !== player.training_focus;
  const atCeiling = Boolean(baseline && baseline.ovr >= ceiling);
  const progress = isNew
    ? 0
    : Math.max(0, Math.min(100, (current - (baseline?.ovr ?? current)) * 100));
  const status = isNew
    ? ("new" as const)
    : atCeiling
      ? ("ceiling" as const)
      : current >= target
        ? ("complete" as const)
        : ("ongoing" as const);
  return { target, progress, status, date: baseline?.date ?? null };
}
