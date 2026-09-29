import { useTranslation } from "react-i18next";
import { ReleaseNotes } from "../settings/ReleaseNotes";

const PREVIOUS_KEYS = [
  "settings.history0501",
  "settings.history0502",
  "settings.history0503",
  "settings.history0504",
] as const;

export function PatchHistoryModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="patch-history-title"
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-gray-900 shadow-2xl dark:bg-navy-800 dark:text-gray-100 sm:p-7"
      >
        <h2 id="patch-history-title" className="font-heading text-xl font-bold">
          {t("settings.patchHistory")}
        </h2>
        <h3 className="mt-4 font-heading font-bold">v0.5.1 · Career Hotfix</h3>
        <ReleaseNotes embedded />
        <h3 className="mt-5 border-t border-gray-200 pt-4 font-heading font-bold dark:border-navy-700">
          v0.5.0 · Career Update
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
          {PREVIOUS_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
        >
          {t("settings.patchHistoryClose")}
        </button>
      </div>
    </div>
  );
}
