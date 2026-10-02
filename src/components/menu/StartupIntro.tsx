import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export const INTRO_SEEN_KEY = "ofm-startup-intro-seen";

export function StartupIntro({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [credit, setCredit] = useState<"studio" | "collaboration">("studio");
  const [visible, setVisible] = useState(false);
  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const skipRef = useRef<HTMLButtonElement>(null);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    onComplete();
  }

  useEffect(() => {
    skipRef.current?.focus();
    const schedule = (ms: number, action: () => void) => {
      timers.current.push(setTimeout(action, ms));
    };
    schedule(40, () => setVisible(true));
    schedule(5400, () => setVisible(false));
    schedule(5800, () => setCredit("collaboration"));
    schedule(5840, () => setVisible(true));
    schedule(11200, () => setVisible(false));
    schedule(11600, () => {
      if (finished.current) return;
      finished.current = true;
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      onComplete();
    });
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-900 px-6 text-white">
      <div
        role="status"
        aria-live="polite"
        className={`flex w-full max-w-lg flex-col items-center gap-6 text-center transition-opacity duration-[400ms] ${reducedMotion ? "transition-none" : ""} ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {credit === "studio" ? (
          <h1 className="font-heading text-5xl font-bold tracking-wide sm:text-7xl">
            Tranquil<span className="text-primary-400">Games</span>
          </h1>
        ) : (
          <>
            <p className="font-heading text-lg font-semibold uppercase tracking-widest text-gray-300">
              {t("phase66.collaboration")}
            </p>
            <img src="/openfootlogo.svg" alt={t("app.name")} className="w-full object-contain" />
          </>
        )}
      </div>
      <button
        ref={skipRef}
        type="button"
        onClick={finish}
        onKeyDown={(event) => {
          if (event.key === "Escape") finish();
        }}
        className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] min-h-11 rounded-xl px-6 text-sm text-gray-300 hover:text-white focus-visible:outline-2 focus-visible:outline-primary-400"
      >
        {t("phase66.skip")}
      </button>
    </div>
  );
}
