import { useEffect, useReducer } from "react";
import {
  highlightPlayback,
  type HighlightPlaybackAction,
  type HighlightPlaybackState,
} from "./highlightPlayback";
export function useHighlightPlayback(clipId: string, length: number, visible = true) {
  const [state, dispatch] = useReducer(
    (state: HighlightPlaybackState, action: HighlightPlaybackAction) =>
      highlightPlayback(state, action, length),
    { frame: 0, playing: false },
  );
  useEffect(() => {
    dispatch({ type: "seek", frame: 0 });
  }, [clipId]);
  useEffect(() => {
    if (!state.playing || !visible) return;
    const timer = setTimeout(() => dispatch({ type: "advance" }), 900);
    return () => clearTimeout(timer);
  }, [state.frame, state.playing, visible]);
  return { ...state, dispatch };
}
