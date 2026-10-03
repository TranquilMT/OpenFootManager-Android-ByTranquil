import { useTranslation } from "react-i18next";
import { APP_VERSION } from "../../lib/appVersion";
import { ReleaseNotes } from "../settings/ReleaseNotes";

const HISTORY = [
  { version: "0.6.6", keys: ["phase66.brand", "phase66.intro", "phase66.footer", "phase66.notes"] },
  {
    version: "0.6.5",
    keys: ["phase65.colours", "phase65.values", "phase65.finances", "phase65.saves"],
  },
  {
    version: "0.6.4",
    keys: [
      "phase64.releaseProgression",
      "phase64.releasePlanning",
      "phase64.releaseDevelopment",
      "phase64.releaseReliability",
    ],
  },
  {
    version: "0.6.3",
    keys: ["phase63.finances", "phase63.matchday", "phase63.career", "phase63.saves"],
  },
  {
    version: "0.6.2",
    keys: ["phase62.strategy", "phase62.decisions", "phase62.autosave", "phase62.academy"],
  },
  {
    version: "0.6.1",
    keys: [
      "phase6.patchNames",
      "phase6.patchIdentity",
      "phase6.patchScrolling",
      "phase6.patchReliability",
    ],
  },
  {
    version: "0.6.0",
    keys: ["phase6.patchBoard", "phase6.patchContracts", "phase6.patchClub", "phase6.patchSquad"],
  },
  {
    version: "0.5.2",
    keys: [
      "settings.hotfixInjuryDetails",
      "settings.hotfixOfferReview",
      "settings.hotfixPortraitNeck",
      "settings.hotfixConversations",
    ],
  },
  {
    version: "0.5.1",
    keys: [
      "settings.careerHighlights",
      "settings.careerInbox",
      "settings.careerSeason",
      "settings.careerYouth",
      "settings.careerYouthScouting",
      "settings.careerRules",
    ],
  },
  {
    version: "0.5.0",
    keys: ["settings.history0501", "settings.history0502", "settings.history0503"],
  },
  {
    version: "0.3.6",
    keys: ["settings.hotfixInbox", "settings.hotfixSave", "settings.hotfixMatch"],
  },
  {
    version: "0.3.1",
    keys: [
      "settings.patchPlayers",
      "settings.patchPortraits",
      "settings.patchWorld",
      "settings.patchTransfers",
      "settings.patchDevelopment",
      "settings.patchMatches",
      "settings.patchMobile",
      "settings.patchFixes",
    ],
  },
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
        <h3 className="mt-4 font-heading font-bold">v{APP_VERSION.replace(/-nightly$/, "")}</h3>
        <ReleaseNotes embedded />
        {HISTORY.filter((release) => release.version !== APP_VERSION.replace(/-nightly$/, "")).map(
          (release) => (
            <section key={release.version}>
              <h3 className="mt-5 border-t border-gray-200 pt-4 font-heading font-bold dark:border-navy-700">
                v{release.version}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                {release.keys.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </section>
          ),
        )}
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
