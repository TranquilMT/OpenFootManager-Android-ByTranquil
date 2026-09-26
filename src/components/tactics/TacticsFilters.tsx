import type { JSX } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CORE_POSITIONS, translatePositionAbbreviation } from "../squad/SquadTab.helpers";
import { Card, Select } from "../ui";

interface TacticsFiltersProps {
  onClear: () => void;
  onPlayerSearchChange: (value: string) => void;
  onPositionFilterChange: (value: string) => void;
  playerSearch: string;
  positionFilter: string;
}

export default function TacticsFilters({ onClear, onPlayerSearchChange, onPositionFilterChange, playerSearch, positionFilter }: TacticsFiltersProps): JSX.Element {
  const { t } = useTranslation();
  const canClear = playerSearch.trim().length > 0 || positionFilter !== "All";

  return (
    <Card>
      <div className="flex flex-col gap-2 p-2.5 sm:p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            inputMode="search"
            value={playerSearch}
            onChange={(event) => onPlayerSearchChange(event.target.value)}
            placeholder={t("squad.filterPlayers")}
            aria-label={t("squad.filterPlayers")}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-base text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-200 sm:py-2 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Select value={positionFilter} onChange={(event) => onPositionFilterChange(event.target.value)} fullWidth aria-label={t("squad.pos")}>
            <option value="All">{t("common.all")}</option>
            {CORE_POSITIONS.map((position) => <option key={position} value={position}>{translatePositionAbbreviation(t, position)}</option>)}
          </Select>
          <button
            type="button"
            onClick={onClear}
            disabled={!canClear}
            aria-label={t("common.clear")}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-xs font-heading font-bold uppercase tracking-wider transition active:scale-95 ${canClear ? "bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-300" : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-60 dark:bg-navy-700"}`}
          >
            <X className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">{t("common.clear")}</span>
          </button>
        </div>
      </div>
    </Card>
  );
}