import { reachedMatchEvents } from "./livePitchModel";
import type { MatchEvent } from "./types";
/** A missing start marker means the log cannot establish the historical score. */
export function highlightScore(events: MatchEvent[], frame: MatchEvent) {
  const history = reachedMatchEvents(events, frame.minute);
  const index = history.indexOf(frame);
  if (index < 0 || !history.some((event) => event.event_type === "KickOff" && event.minute === 0))
    return null;
  const score = { home: 0, away: 0 };
  for (const event of history.slice(0, index + 1)) {
    if (event.event_type === "Goal" || event.event_type === "PenaltyGoal") {
      if (event.side === "Home") score.home++;
      else if (event.side === "Away") score.away++;
    }
  }
  return score;
}

export function highlightShootout(events: MatchEvent[], frame: MatchEvent) {
  const index = events.indexOf(frame);
  if (index < 0) return null;
  const kicks = events
    .slice(0, index + 1)
    .filter((event) => event.event_type === "ShootoutGoal" || event.event_type === "ShootoutMiss");
  if (!kicks.length) return null;
  return {
    home: kicks.filter((event) => event.event_type === "ShootoutGoal" && event.side === "Home")
      .length,
    away: kicks.filter((event) => event.event_type === "ShootoutGoal" && event.side === "Away")
      .length,
  };
}
