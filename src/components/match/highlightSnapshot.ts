import { highlightScore } from "./highlightScore";
import { reachedMatchEvents } from "./livePitchModel";
import type { MatchEvent, MatchSnapshot } from "./types";
export function highlightSnapshot(snapshot: MatchSnapshot, frame: MatchEvent): MatchSnapshot {
  const history = reachedMatchEvents(snapshot.events, frame.minute);
  const index = history.indexOf(frame);
  const score = highlightScore(snapshot.events, frame);
  return {
    ...snapshot,
    current_minute: frame.minute,
    events: index < 0 ? [frame] : history.slice(0, index + 1),
    home_score: score?.home ?? 0,
    away_score: score?.away ?? 0,
  };
}
