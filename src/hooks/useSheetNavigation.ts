import { useCallback, useEffect, useId, useRef, type RefObject } from "react";

const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Give a mobile sheet its own Back step without changing the route. */
export function useSheetNavigation(
  open: boolean,
  onDismiss: () => void,
  sheet: RefObject<HTMLElement | null>,
): (afterClose?: () => void) => void {
  const id = useId();
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const afterClose = useRef<(() => void) | undefined>(undefined);
  const closing = useRef(false);

  useEffect(() => {
    if (!open) return;
    closing.current = false;
    afterClose.current = undefined;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousState: unknown = window.history.state;
    window.history.pushState({ ...window.history.state, ofmSheet: id }, "", window.location.href);
    sheet.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const pop = () => {
      const action = afterClose.current;
      afterClose.current = undefined;
      dismiss.current();
      previousFocus?.focus();
      action?.();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!closing.current) {
          closing.current = true;
          window.history.back();
        }
      }
      if (event.key !== "Tab") return;
      const targets = Array.from(sheet.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("popstate", pop);
    document.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("popstate", pop);
      document.removeEventListener("keydown", key);
      if (window.history.state?.ofmSheet === id)
        window.history.replaceState(previousState, "", window.location.href);
      previousFocus?.focus();
    };
  }, [open, id, sheet]);

  return useCallback((action?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    afterClose.current = action;
    window.history.back();
  }, []);
}
