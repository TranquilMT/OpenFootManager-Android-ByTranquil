export interface HighlightPlaybackState {
  frame: number;
  playing: boolean;
}
export type HighlightPlaybackAction =
  | { type: "play" | "pause" | "advance" | "restart" }
  | { type: "seek"; frame: number };
export function highlightPlayback(
  state: HighlightPlaybackState,
  action: HighlightPlaybackAction,
  length: number,
): HighlightPlaybackState {
  const last = Math.max(0, Number.isFinite(length) ? Math.floor(length) - 1 : 0);
  const bounded = (frame: number) =>
    Number.isFinite(frame) ? Math.min(last, Math.max(0, Math.floor(frame))) : 0;
  if (!Number.isSafeInteger(length) || length <= 0) return { frame: 0, playing: false };
  const current = { ...state, frame: bounded(state.frame) };
  switch (action.type) {
    case "play":
      return { ...current, playing: current.frame < last };
    case "pause":
      return { ...current, playing: false };
    case "restart":
      return { frame: 0, playing: last > 0 };
    case "advance":
      return { ...current, frame: bounded(current.frame + 1), playing: current.frame + 1 < last };
    case "seek":
      return { frame: bounded(action.frame), playing: false };
  }
}
