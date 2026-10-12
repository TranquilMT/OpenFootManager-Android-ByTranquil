import { highlightSnapshot } from "./highlightSnapshot";
import { useTranslation } from "react-i18next";
import { getCommentary } from "./commentary";
import { getEventTypeLabel } from "./helpers";
import { eventClockLabels } from "./eventClock";
import { reachedMatchEvents } from "./livePitchModel";
import type { MatchEvent, MatchSnapshot } from "./types";
export default function HighlightNarration({
  frame,
  snapshot,
}: {
  frame: MatchEvent;
  snapshot: MatchSnapshot;
}) {
  const { t } = useTranslation();
  const history = reachedMatchEvents(snapshot.events, frame.minute);
  const replaySnapshot = highlightSnapshot(snapshot, frame);
  const line = getCommentary(frame, replaySnapshot, t)?.line;
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="space-y-1 rounded-xl bg-gray-100 p-3 text-sm text-gray-900 dark:bg-navy-700 dark:text-white"
    >
      <p className="font-semibold">
        <span className="tabular-nums">
          {eventClockLabels(history).get(frame) ?? frame.minute}'
        </span>{" "}
        · {frame.side === "Home" ? snapshot.home_team.name : snapshot.away_team.name}
      </p>
      <p>{getEventTypeLabel(frame.event_type, t)}</p>
      {line && <p className="break-words">{line}</p>}
    </div>
  );
}
