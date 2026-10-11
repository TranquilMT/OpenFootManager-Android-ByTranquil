import { useEffect, useReducer } from "react";
import {
  highlightPlayback,
  type HighlightPlaybackAction,
  type HighlightPlaybackState,
} from "./highlightPlayback";
export function useHighlightPlayback(_clipId: string, length: number) {
  const [state, dispatch] = useReducer(
    (state: HighlightPlaybackState, action: HighlightPlaybackAction) =>
      highlightPlayback(state, action, length),
    { frame: 0, playing: false },
  );
  useEffect(() => {
    if (!state.playing) return;
    const timer = setTimeout(() => dispatch({ type: "advance" }), 900);
    return () => clearTimeout(timer);
  }, [state.frame, state.playing]);
  return { ...state, dispatch };
}
