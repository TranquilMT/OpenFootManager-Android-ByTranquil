import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";

const ISSUE_URL = "https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/issues/new";

const HIGHLIGHT_KEYS = [
  "phase65.colours",
  "phase65.values",
  "phase65.finances",
  "phase65.saves",
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
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
        {HIGHLIGHT_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t("settings.patchThanks")}</p>
      <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("settings.patchSignature")}
      </p>
      <button
        type="button"
        onClick={() => void openUrl(ISSUE_URL)}
        className="min-h-11 rounded-lg px-3 text-sm font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-primary-500 dark:text-primary-400"
      >
        {t("settings.patchReportIssue")}
      </button>
    </div>
  );
}
