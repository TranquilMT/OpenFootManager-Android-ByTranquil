import { useTranslation } from "react-i18next";
import { Badge } from "../ui";
import { getEventDisplay, getPlayerName } from "./helpers";
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
                <span className="w-7 text-right text-xs text-gray-500">{event.minute}'</span>
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
