import { useTranslation } from "react-i18next";
import { EVENT_FILTERS, filterMatchEvents, type EventFilter } from "./eventFilters";
import type { MatchEvent } from "./types";

export function MatchEventFilters({
  events,
  value,
  onChange,
}: {
  events: MatchEvent[];
  value: EventFilter;
  onChange: (filter: EventFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <fieldset
      aria-label={t("match.events")}
      className="touch-x flex shrink-0 gap-2 overflow-x-auto border-b border-gray-200 px-3 py-1 dark:border-navy-700"
    >
      {EVENT_FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          aria-pressed={value === filter.id}
          onClick={() => onChange(filter.id)}
          className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-semibold ${value === filter.id ? "bg-primary-50 text-primary-600 dark:bg-navy-700 dark:text-primary-400" : "text-gray-600 dark:text-gray-300"}`}
        >
          {t(filter.key)} ({filterMatchEvents(events, filter.id).length})
        </button>
      ))}
    </fieldset>
  );
}
