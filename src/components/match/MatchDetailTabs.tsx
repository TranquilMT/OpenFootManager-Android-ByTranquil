import { useTranslation } from "react-i18next";
import { Users, BarChart3, MessageSquare, Volume2, VolumeX } from "lucide-react";
const ACTIVE_PANELS = ["events", "stats", "lineups", "highlights", "players"] as const;
export type ActivePanel = (typeof ACTIVE_PANELS)[number];
export default function MatchDetailTabs({
  activePanel,
  onChange,
  voiceEnabled,
  voiceAvailable,
  onToggleVoice,
}: {
  activePanel: ActivePanel;
  onChange: (panel: ActivePanel) => void;
  voiceEnabled: boolean;
  voiceAvailable: boolean;
  onToggleVoice: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t("match.matchDetails")}
      className="touch-x flex overflow-x-auto bg-white dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 transition-colors duration-300"
    >
      {[
        {
          id: "events" as ActivePanel,
          label: t("match.events"),
          icon: <MessageSquare className="w-4 h-4" />,
        },
        {
          id: "stats" as ActivePanel,
          label: t("match.stats"),
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          id: "lineups" as ActivePanel,
          label: t("match.lineups"),
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: "highlights" as ActivePanel,
          label: t("match.highlights.title"),
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          id: "players" as ActivePanel,
          label: `${t("match.player")} ${t("match.stats")}`,
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ].map((tab) => (
        <button
          type="button"
          key={tab.id}
          role="tab"
          id={`match-tab-${tab.id}`}
          aria-selected={activePanel === tab.id}
          aria-controls={`match-panel-${tab.id}`}
          tabIndex={activePanel === tab.id ? 0 : -1}
          onKeyDown={(event) => {
            const index = ACTIVE_PANELS.indexOf(tab.id);
            const next =
              event.key === "ArrowRight"
                ? (index + 1) % ACTIVE_PANELS.length
                : event.key === "ArrowLeft"
                  ? (index + ACTIVE_PANELS.length - 1) % ACTIVE_PANELS.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? ACTIVE_PANELS.length - 1
                      : null;
            if (next == null) return;
            event.preventDefault();
            onChange(ACTIVE_PANELS[next]);
            event.currentTarget.parentElement
              ?.querySelector<HTMLButtonElement>(`#match-tab-${ACTIVE_PANELS[next]}`)
              ?.focus();
          }}
          onClick={() => onChange(tab.id)}
          className={`flex min-h-11 shrink-0 items-center gap-2 px-4 py-3 sm:px-5 font-heading font-bold text-xs uppercase tracking-wider transition-colors border-b-2 ${
            activePanel === tab.id
              ? "text-primary-500 dark:text-primary-400 border-primary-500 bg-primary-50 dark:bg-navy-700/50"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
      {voiceAvailable && (
        <button
          type="button"
          aria-label={t(voiceEnabled ? "match.voiceOff" : "match.voiceOn")}
          aria-pressed={voiceEnabled}
          onClick={onToggleVoice}
          className="ml-auto flex min-h-11 min-w-11 shrink-0 items-center justify-center text-gray-500 dark:text-gray-300"
        >
          {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}
