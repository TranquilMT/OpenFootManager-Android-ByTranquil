import type { MatchHighlight } from "./highlightModel";
export interface HighlightQuery {
  side?: "all" | "Home" | "Away";
}
export function selectHighlights(clips: MatchHighlight[], query: HighlightQuery): MatchHighlight[] {
  return clips.filter(
    (clip) => !query.side || query.side === "all" || clip.outcome.side === query.side,
  );
}
