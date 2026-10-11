import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Gamepad2, Sparkles } from "lucide-react";
import { APP_VERSION } from "../../lib/appVersion";
import { ReleaseNotes } from "../settings/ReleaseNotes";

const VERSION = `v${APP_VERSION.replace(/-nightly$/, "")}`;
export const WHATS_NEW_DISMISSED_KEY = `ofm-whats-new-dismissed-${VERSION}`;
export const WHATS_NEW_SEEN_KEY = `ofm-whats-new-seen-${VERSION}`;

export function WhatsNewModal() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(
    () =>
      window.localStorage.getItem(WHATS_NEW_DISMISSED_KEY) !== "1" &&
      window.sessionStorage.getItem(WHATS_NEW_SEEN_KEY) !== "1",
  );
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const previousFocus = document.activeElement;
    continueRef.current?.focus();
    const timer = setTimeout(() => setRevealed(true), 40);
    return () => {
      clearTimeout(timer);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [visible]);

  if (!visible) return null;

  function close() {
    window.sessionStorage.setItem(WHATS_NEW_SEEN_KEY, "1");
    if (doNotShowAgain) window.localStorage.setItem(WHATS_NEW_DISMISSED_KEY, "1");
    setVisible(false);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 p-3 transition-opacity duration-[400ms] motion-reduce:transition-none sm:p-6 ${revealed ? "opacity-100" : "opacity-0"}`}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ofm-whats-new-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
          if (event.key !== "Tab") return;
          const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button, input");
          if (!controls?.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-navy-600 dark:bg-navy-800 dark:text-gray-100"
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <header className="border-b border-primary-100 bg-linear-to-br from-primary-50 to-primary-100 p-5 dark:border-navy-600 dark:from-navy-900 dark:to-navy-700 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-widest text-primary-800 dark:text-primary-300">
                <Sparkles aria-hidden="true" className="size-4" />
                {t("settings.whatsNew")}
              </span>
              <span className="rounded-full border border-primary-200 bg-white px-3 py-1 font-heading text-sm font-bold text-primary-800 dark:border-navy-600 dark:bg-navy-800 dark:text-primary-300">
                {VERSION}
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-lg dark:bg-primary-600 dark:text-white"
              >
                <Gamepad2 className="size-8" />
              </span>
              <div className="min-w-0">
                <h2
                  id="ofm-whats-new-title"
                  className="font-heading text-2xl font-bold uppercase tracking-wide sm:text-3xl"
                >
                  {t("settings.patchWelcome")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-primary-900 dark:text-gray-200">
                  {t("phase74.intro")}
                </p>
              </div>
            </div>
          </header>
          <div className="px-5 pb-5 sm:px-7">
            <ReleaseNotes embedded />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-navy-600 dark:bg-navy-800 sm:px-7">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(event) => setDoNotShowAgain(event.target.checked)}
              className="size-5 accent-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:accent-primary-400 dark:focus-visible:outline-primary-400"
            />
            {t("menu.doNotShowWhatsNew", { version: VERSION })}
          </label>
          <button
            ref={continueRef}
            type="button"
            onClick={close}
            className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-primary-700 px-5 font-heading text-base font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 motion-reduce:transition-none dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700 dark:focus-visible:outline-primary-400"
          >
            {t("menu.continueToGame")}
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
