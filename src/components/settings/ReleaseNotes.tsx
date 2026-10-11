import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import {
  BrainCircuit,
  Hand,
  Target,
  ChartNoAxesCombined,
  ShieldCheck,
  Heart,
  Bug,
} from "lucide-react";

const ISSUE_URL = "https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/issues/new";

const HIGHLIGHT_KEYS = [
  { key: "phase74.release.ai", title: "phase74.labels.ai", Icon: BrainCircuit },
  { key: "phase74.release.match", title: "phase74.labels.match", Icon: Hand },
  { key: "phase74.release.controls", title: "phase74.labels.controls", Icon: Target },
  { key: "phase74.release.analysis", title: "phase74.labels.analysis", Icon: ChartNoAxesCombined },
  { key: "phase74.release.reliability", title: "phase74.labels.reliability", Icon: ShieldCheck },
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
      <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200 md:grid-cols-2">
        {HIGHLIGHT_KEYS.map(({ key, title, Icon }) => (
          <li
            key={key}
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 last:md:col-span-2 dark:border-navy-600 dark:bg-navy-700"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h3 className="mb-1 font-heading text-base font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                {t(title)}
              </h3>
              <p>{t(key)}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        <Heart
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary-600 dark:text-primary-400"
        />
        <p>{t("phase70.release.thanks")}</p>
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
