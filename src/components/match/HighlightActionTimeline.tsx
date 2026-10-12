import { eventClockLabels } from "./eventClock";
import { useTranslation } from "react-i18next";
import { getEventTypeLabel } from "./helpers";
import type { MatchEvent } from "./types";
export default function HighlightActionTimeline({
  events,
  history = events,
  frame,
  onSeek,
}: {
  events: MatchEvent[];
  history?: MatchEvent[];
  frame: number;
  onSeek: (frame: number) => void;
}) {
  const { t } = useTranslation();
  const clocks = eventClockLabels(
    [...history.filter((event) => !events.includes(event)), ...events].sort(
      (a, b) => a.minute - b.minute,
    ),
  );
  return (
    <ol aria-label={t("match.events")} className="flex gap-2 overflow-x-auto px-3 py-2">
      {events.map((event, index) => (
        <li key={`${event.event_type}:${event.minute}:${index}`} className="shrink-0">
          <button
            type="button"
            aria-current={index === frame ? "step" : undefined}
            onClick={() => onSeek(index)}
            className={`min-h-11 rounded-lg px-3 text-xs ${index === frame ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-white" : "bg-gray-100 dark:bg-navy-700"}`}
          >
            {clocks.get(event) ?? event.minute}' · {getEventTypeLabel(event.event_type, t)}
          </button>
        </li>
      ))}
    </ol>
  );
}
