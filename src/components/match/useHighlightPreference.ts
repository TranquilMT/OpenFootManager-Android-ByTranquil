import { useState } from "react";
import type { HighlightPreference } from "./HighlightModeControls";
export const HIGHLIGHT_PREFERENCE_KEY = "ofm-highlight-mode";
export function useHighlightPreference() {
  const [mode, setMode] = useState<HighlightPreference>(() => {
    try {
      const saved = localStorage.getItem(HIGHLIGHT_PREFERENCE_KEY);
      return saved === "key" || saved === "extended" || saved === "off" ? saved : "key";
    } catch {
      return "key";
    }
  });
  const change = (value: HighlightPreference) => {
    setMode(value);
    try {
      localStorage.setItem(HIGHLIGHT_PREFERENCE_KEY, value);
    } catch {
      /* Storage is optional for gameplay. */
    }
  };
  return [mode, change] as const;
}
