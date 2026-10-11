import { matchMetrics } from "./narrativeContext";
import type { MatchEvent } from "./types";
/** Compare recorded events only; substitution observations do not imply causation. */
export function analyzeMatch(events: MatchEvent[], side: "Home" | "Away", minute: number) {
  const valid = events.filter(
    (e) =>
      Number.isFinite(e.minute) &&
      e.minute >= 0 &&
      e.minute <= minute &&
      !e.event_type.startsWith("Shootout"),
  );
  const measured = valid.filter(
    (e) =>
      e.side === side &&
      e.shot &&
      Number.isFinite(e.shot.expected_goals) &&
      e.shot.expected_goals >= 0 &&
      e.shot.expected_goals <= 1,
  );
  let lastSub = -1;
  valid.forEach((event, index) => {
    if (event.side === side && event.event_type === "Substitution") lastSub = index;
  });
  const after = lastSub >= 0 ? valid.slice(lastSub + 1) : [];
  return {
    metrics: matchMetrics(valid, side),
    recordedShots: measured.length,
    bigChances: measured.filter((e) => (e.shot?.expected_goals ?? 0) >= 0.3).length,
    tacticalChanges: valid.filter((e) => e.side === side && e.event_type === "TacticalChange")
      .length,
    afterSubstitution:
      lastSub >= 0
        ? {
            ...matchMetrics(after, side),
            conceded: after.filter(
              (e) => e.side !== side && ["Goal", "PenaltyGoal"].includes(e.event_type),
            ).length,
            minute: valid[lastSub].minute,
          }
        : null,
  };
}
