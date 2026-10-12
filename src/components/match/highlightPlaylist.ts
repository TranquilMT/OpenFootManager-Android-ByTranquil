import type { MatchHighlight } from "./highlightModel";
export function playlistNeighbour(
  clips: MatchHighlight[],
  id: string,
  direction: -1 | 1,
): MatchHighlight | null {
  const index = clips.findIndex((clip) => clip.id === id);
  return index < 0 ? null : (clips[index + direction] ?? null);
}
