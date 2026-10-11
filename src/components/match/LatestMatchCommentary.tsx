import { useTranslation } from "react-i18next";
import { getCommentary } from "./commentary";
import { reachedMatchEvents } from "./livePitchModel";
import { formatMatchMinute } from "./matchClock";
import type { MatchSnapshot } from "./types";

export default function LatestMatchCommentary({ snapshot }: { snapshot: MatchSnapshot }) {
  const { t } = useTranslation();
  const latest = reachedMatchEvents(snapshot.events, snapshot.current_minute).at(-1);
  const commentary = latest ? getCommentary(latest, snapshot, t) : null;
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="flex min-h-12 shrink-0 items-center gap-3 border-y border-primary-200 bg-primary-50 px-3 py-2 text-sm text-gray-900 dark:border-primary-800 dark:bg-primary-900 dark:text-white"
    >
      {latest && (
        <span className="shrink-0 font-bold tabular-nums">
          {formatMatchMinute(snapshot.phase, latest.minute)}'
        </span>
      )}
      <p className="min-w-0 leading-snug">
        {commentary?.line ??
          t(snapshot.phase === "PreKickOff" ? "match.waitingKickoff" : "match.noEventsYet")}
      </p>
    </div>
  );
}
