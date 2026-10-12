import { useEffect, useRef } from "react";
export function useHighlightAutoNext(clipId: string, enabled: boolean, onNext?: () => void) {
  const next = useRef(onNext);
  next.current = onNext;
  useEffect(() => {
    if (!enabled || !onNext) return;
    const timer = setTimeout(() => next.current?.(), 1500);
    return () => clearTimeout(timer);
  }, [clipId, enabled, !!onNext]);
}
