import { useEffect, useRef } from "react";
import type { TFunction } from "i18next";
import { getCommentary } from "./commentary";
import type { MatchEvent, MatchSnapshot } from "./types";

export function spokenCommentaryAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

export function cancelSpokenCommentary(): void {
  if (spokenCommentaryAvailable()) window.speechSynthesis.cancel();
}

export function useSpokenCommentary(
  events: MatchEvent[],
  snapshot: MatchSnapshot,
  translate: TFunction,
  language: string,
  enabled: boolean,
): void {
  const narratedCount = useRef(events.length);

  useEffect(() => {
    const currentCount = events.length;
    if (currentCount <= narratedCount.current) {
      narratedCount.current = currentCount;
      return;
    }
    narratedCount.current = currentCount;
    if (!enabled || !spokenCommentaryAvailable()) return;

    const commentary = getCommentary(events[currentCount - 1], snapshot, translate);
    if (!commentary) return;

    cancelSpokenCommentary();
    const utterance = new SpeechSynthesisUtterance(commentary.line);
    utterance.lang = language;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }, [events, snapshot, translate, language, enabled]);

  useEffect(() => cancelSpokenCommentary, []);
}
