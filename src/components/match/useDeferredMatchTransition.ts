import { useCallback, useEffect, useRef } from "react";
export function useDeferredMatchTransition(blocked: boolean) {
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  const pending = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      if (blockedRef.current) return;
      const callback = pending.current;
      pending.current = null;
      callback?.();
    }, 600);
  }, []);
  const schedule = useCallback(
    (callback: () => void) => {
      pending.current = callback;
      arm();
    },
    [arm],
  );
  useEffect(() => {
    if (!blocked && pending.current) arm();
  }, [blocked, arm]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      pending.current = null;
    },
    [],
  );
  return schedule;
}
