import { useTranslation } from "react-i18next";
import type { MatchHighlight } from "./highlightModel";
import type { MatchSnapshot } from "./types";
import { getEventTypeLabel, getPlayerName } from "./helpers";
import { eventClockLabels } from "./eventClock";
import { reachedMatchEvents } from "./livePitchModel";
export default function HighlightList({
  clips,
  snapshot,
  onSelect,
}: {
  clips: MatchHighlight[];
  snapshot: MatchSnapshot;
  onSelect: (clip: MatchHighlight) => void;
}) {
  const { t } = useTranslation();
  const clocks = eventClockLabels(reachedMatchEvents(snapshot.events, snapshot.current_minute));
  if (!clips.length)
    return <p className="p-4 text-sm text-gray-500 dark:text-gray-400">{t("match.noEventsYet")}</p>;
  return (
    <ol className="space-y-2">
      {[...clips].reverse().map((clip) => (
        <li key={clip.id}>
          <button
            type="button"
            onClick={() => onSelect(clip)}
            className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-gray-100 p-3 text-left text-gray-900 dark:bg-navy-700 dark:text-white"
          >
            <span className="shrink-0 font-bold tabular-nums">
              {clocks.get(clip.outcome) ?? clip.outcome.minute}'
            </span>
            <span className="min-w-0 flex-1 break-words">
              <span className="block font-semibold">
                {getEventTypeLabel(clip.outcome.event_type, t)}
              </span>
              <span className="block text-xs">
                {clip.outcome.side === "Home" ? snapshot.home_team.name : snapshot.away_team.name}
              </span>
              <span className="block text-xs">
                {getPlayerName(snapshot, clip.outcome.player_id)}
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold">{t("match.highlights.replay")}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
