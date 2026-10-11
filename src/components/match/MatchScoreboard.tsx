import { useTranslation } from "react-i18next";
import { formatMatchMinute } from "./matchClock";
import { phaseLabel } from "./helpers";

interface MatchScoreboardProps {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  phase: string;
  minute: number;
  running: boolean;
}

export default function MatchScoreboard({
  homeName,
  awayName,
  homeScore,
  awayScore,
  phase,
  minute,
  running,
}: MatchScoreboardProps) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0 space-y-1">
      <div className="grid min-w-0 grid-cols-3 items-center gap-2">
        <p className="min-w-0 break-words text-right font-heading text-sm font-bold text-gray-900 dark:text-white sm:text-lg">
          {homeName}
        </p>
        <div
          aria-label={t("common.score")}
          className="whitespace-nowrap text-center font-heading text-3xl font-bold tabular-nums text-gray-900 dark:text-white"
        >
          {homeScore} – {awayScore}
        </div>
        <p className="min-w-0 break-words font-heading text-sm font-bold text-gray-900 dark:text-white sm:text-lg">
          {awayName}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 text-xs text-gray-600 dark:text-gray-300">
        <span>{phaseLabel(phase, t)}</span>
        <span className="font-bold tabular-nums">{formatMatchMinute(phase, minute)}'</span>
        <span>{t(running ? "match.live" : "match.paused")}</span>
      </div>
    </div>
  );
}
