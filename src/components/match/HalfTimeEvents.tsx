import { useTranslation } from "react-i18next";
import { Badge } from "../ui";
import { getEventDisplay, getPlayerName } from "./helpers";
import { eventClockLabels } from "./eventClock";
import { reachedMatchEvents } from "./livePitchModel";
import type { MatchEvent, MatchSnapshot } from "./types";
const MAJOR_EVENTS = new Set([
  "Goal",
  "PenaltyGoal",
  "YellowCard",
  "RedCard",
  "SecondYellow",
  "Injury",
  "PenaltyMiss",
]);
export default function HalfTimeEvents({
  snapshot,
  events,
}: {
  snapshot: MatchSnapshot;
  events: MatchEvent[];
}) {
  const { t } = useTranslation();
  const reached = reachedMatchEvents(events, snapshot.current_minute).filter((event) =>
    MAJOR_EVENTS.has(event.event_type),
  );
  const history = reachedMatchEvents(snapshot.events, snapshot.current_minute);
  const clocks = eventClockLabels(history);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-800">
      <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-gray-500">
        {t("match.firstHalfEvents")}
      </h3>
      {reached.length === 0 ? (
        <p className="text-sm text-gray-500">{t("match.noMajorEvents")}</p>
      ) : (
        <div className="space-y-2">
          {reached.map((event, index) => {
            const display = getEventDisplay(event);
            return (
              <div
                key={`${event.minute}:${event.event_type}:${event.player_id}:${index}`}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-gray-50 px-2 dark:bg-navy-700/50"
              >
                <span className="min-w-7 shrink-0 text-right text-xs text-gray-500">
                  {clocks.get(event) ??
                    clocks.get(
                      history.find(
                        (recorded) =>
                          recorded.minute === event.minute &&
                          recorded.event_type === event.event_type &&
                          recorded.side === event.side &&
                          recorded.player_id === event.player_id,
                      ) ?? event,
                    ) ??
                    event.minute}
                  '
                </span>
                <span>{display.icon}</span>
                <span className={`min-w-0 flex-1 truncate text-sm ${display.color}`}>
                  {getPlayerName(snapshot, event.player_id)}
                </span>
                <Badge variant={event.side === "Home" ? "primary" : "accent"} size="sm">
                  {(event.side === "Home"
                    ? snapshot.home_team.name
                    : snapshot.away_team.name
                  ).substring(0, 3)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
