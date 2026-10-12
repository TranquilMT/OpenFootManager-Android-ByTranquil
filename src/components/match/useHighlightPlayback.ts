import { useEffect, useReducer } from "react";
import {
  highlightPlayback,
  type HighlightPlaybackAction,
  type HighlightPlaybackState,
} from "./highlightPlayback";
export function useHighlightPlayback(
  clipId: string,
  length: number,
  visible = true,
  intervalMs = 900,
) {
  const delay = Number.isFinite(intervalMs) ? Math.min(3000, Math.max(200, intervalMs)) : 900;
  const [state, dispatch] = useReducer(
    (state: HighlightPlaybackState, action: HighlightPlaybackAction) =>
      highlightPlayback(state, action, length),
    { frame: 0, playing: false },
  );
  useEffect(() => {
    dispatch({ type: "seek", frame: 0 });
  }, [clipId]);
  useEffect(() => {
    dispatch({ type: "reconcile" });
  }, [length]);
  useEffect(() => {
    if (!state.playing || !visible) return;
    const timer = setTimeout(() => dispatch({ type: "advance" }), delay);
    return () => clearTimeout(timer);
  }, [state.frame, state.playing, visible, delay]);
  return { ...state, dispatch };
}
