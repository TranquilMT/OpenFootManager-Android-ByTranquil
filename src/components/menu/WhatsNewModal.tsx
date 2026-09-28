import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const continueRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) continueRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  function close() {
    window.sessionStorage.setItem(WHATS_NEW_SEEN_KEY, "1");
    if (doNotShowAgain) window.localStorage.setItem(WHATS_NEW_DISMISSED_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 p-3 sm:p-6">
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
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 text-gray-900 shadow-2xl dark:bg-navy-800 dark:text-gray-100 sm:p-7"
      >
        <h2 id="ofm-whats-new-title" className="text-xl font-heading font-bold">
          {t("settings.patchWelcome")}
        </h2>
        <ReleaseNotes embedded />
        <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-navy-700">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(event) => setDoNotShowAgain(event.target.checked)}
              className="size-5 accent-primary-500"
            />
            {t("menu.doNotShowWhatsNew")}
          </label>
          <button
            ref={continueRef}
            type="button"
            onClick={close}
            className="min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {t("menu.continueToGame")}
          </button>
        </div>
      </div>
    </div>
  );
}
