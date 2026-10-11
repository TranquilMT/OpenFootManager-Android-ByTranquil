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
  switch (action.type) {
    case "play":
      return { ...state, playing: true };
    case "pause":
      return { ...state, playing: false };
    case "restart":
      return { frame: 0, playing: true };
    case "advance":
      return { ...state, frame: Math.min(length - 1, state.frame + 1) };
    case "seek":
      return { frame: action.frame, playing: false };
  }
}
