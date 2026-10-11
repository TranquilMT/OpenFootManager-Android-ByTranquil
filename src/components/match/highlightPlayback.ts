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
  if (length <= 0) return { frame: 0, playing: false };
  switch (action.type) {
    case "play":
      return { ...state, playing: state.frame < last };
    case "pause":
      return { ...state, playing: false };
    case "restart":
      return { frame: 0, playing: true };
    case "advance":
      return { ...state, frame: bounded(state.frame + 1), playing: state.frame + 1 < last };
    case "seek":
      return { frame: bounded(action.frame), playing: false };
  }
}
