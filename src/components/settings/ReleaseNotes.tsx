import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import { Sparkles, Monitor, Clapperboard, Heart, Bug } from "lucide-react";

const ISSUE_URL = "https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/issues/new";

const HIGHLIGHT_KEYS = [
  { key: "phase66.intro", Icon: Clapperboard },
  { key: "phase66.footer", Icon: Monitor },
  { key: "phase66.notes", Icon: Sparkles },
] as const;

export function ReleaseNotes({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className={embedded ? "" : "mt-4 border-t border-gray-200 pt-4 dark:border-navy-700"}>
      {!embedded && (
        <>
          <h3 className="text-sm font-heading font-bold uppercase">{t("settings.whatsNew")}</h3>
          <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t("settings.patchWelcome")}
          </p>
        </>
      )}
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
        {HIGHLIGHT_KEYS.map(({ key, Icon }) => (
          <li
            key={key}
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-navy-600 dark:bg-navy-700"
          >
            <Icon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary-600 dark:text-primary-400"
            />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        <Heart
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary-600 dark:text-primary-400"
        />
        <p>{t("phase66.thanks")}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("settings.patchSignature")}
      </p>
      <button
        type="button"
        onClick={() => void openUrl(ISSUE_URL)}
        className="mt-3 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-primary-500 dark:text-primary-400"
      >
        <Bug aria-hidden="true" className="size-4 shrink-0" />
        {t("settings.patchReportIssue")}
      </button>
    </div>
  );
}
