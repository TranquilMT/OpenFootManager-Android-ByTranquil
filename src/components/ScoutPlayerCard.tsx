import { useTranslation } from "react-i18next";
import {
  User,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { ProgressBar, CountryFlag } from "./ui";
import { countryName } from "../lib/countries";
import type { ScoutReportData } from "../store/gameStore";
interface ScoutPlayerCardProps {
  report: ScoutReportData;
  onPlayerClick?: (playerId: string) => void;
}
interface AttrRow {
  labelKey: string;
  value: number | null;
}
function confidenceColor(k: string) {
  return k.endsWith(".high")
    ? "text-success-500"
    : k.endsWith(".moderate")
      ? "text-accent-500"
      : "text-red-500";
}
function ratingColor(k: string) {
  return k.endsWith(".excellent")
    ? "text-success-500"
    : k.endsWith(".veryGood")
      ? "text-primary-500"
      : k.endsWith(".good")
        ? "text-accent-500"
        : k.endsWith(".average")
          ? "text-yellow-500"
          : "text-red-500";
}
export default function ScoutPlayerCard({ report, onPlayerClick }: ScoutPlayerCardProps) {
  const { t, i18n } = useTranslation();
  const attrs: AttrRow[] = [
    { labelKey: "common.attributes.pace", value: report.pace },
    { labelKey: "common.attributes.shooting", value: report.shooting },
    { labelKey: "common.attributes.passing", value: report.passing },
    { labelKey: "common.attributes.dribbling", value: report.dribbling },
    { labelKey: "common.attributes.defending", value: report.defending },
    { labelKey: "common.attributes.strength", value: report.physical },
  ];
  const discoveredCount = attrs.filter((a) => a.value !== null).length;
  return (
    <article
      className={`mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-navy-600 dark:from-navy-700 dark:to-navy-800 ${onPlayerClick ? "active:scale-[.995]" : ""}`}
    >
      <button
        type="button"
        disabled={!onPlayerClick}
        aria-label={
          onPlayerClick
            ? `${report.player_name} — ${t(`common.positions.${report.position}`, report.position)}`
            : undefined
        }
        onClick={() => onPlayerClick?.(report.player_id)}
        className="flex min-h-14 w-full touch-manipulation items-center gap-3 bg-navy-700 px-3 py-3 text-left disabled:cursor-default dark:bg-navy-900 sm:px-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-600">
          <User className="h-5 w-5 text-gray-300" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-heading text-sm font-bold text-white">
            {report.player_name}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {t(`common.positions.${report.position}`, report.position)}
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <CountryFlag
                code={report.nationality}
                locale={i18n.language}
                className="text-sm leading-none"
              />
              <span className="truncate">{countryName(report.nationality, i18n.language)}</span>
            </span>
          </div>
        </div>
        {onPlayerClick && (
          <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-primary-400" />
        )}
      </button>
      <div className="space-y-4 p-3 sm:p-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
          {report.team_name && (
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary-500" />
              {report.team_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <time dateTime={report.dob}>{report.dob}</time>
          </span>
          {report.condition !== null && (
            <span>
              {t("scouting.condition")}: {report.condition}%
            </span>
          )}
          {report.morale !== null && (
            <span>
              {t("scouting.morale")}: {report.morale}/100
            </span>
          )}
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            <BarChart3 className="h-3 w-3" />
            {t("scouting.estimatedAttributes")} ({discoveredCount}/6)
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-4">
            {attrs.map((attr) => (
              <div key={attr.labelKey} className="flex min-h-8 items-center gap-2">
                <span className="w-20 truncate text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t(attr.labelKey)}
                </span>
                {attr.value !== null ? (
                  <>
                    <div className="flex-1">
                      <ProgressBar value={attr.value} size="sm" />
                    </div>
                    <span className="w-6 text-right text-xs font-bold tabular-nums text-gray-700 dark:text-gray-200">
                      {attr.value}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-1 items-center gap-1.5 text-gray-400 dark:text-gray-500">
                    <EyeOff className="h-3 w-3" />
                    <span className="text-xs italic">{t("scouting.undiscovered")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-navy-600">
          {report.avg_rating !== null && (
            <span
              className={`inline-flex min-h-9 items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-bold dark:bg-navy-600 ${ratingColor(report.rating_key)}`}
            >
              <BarChart3 className="h-3 w-3" />
              {t(report.rating_key)} (~{report.avg_rating})
            </span>
          )}
          <span
            className={`inline-flex min-h-9 items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-bold dark:bg-navy-600 ${ratingColor(report.potential_key)}`}
          >
            <TrendingUp className="h-3 w-3" />
            {t(report.potential_key)}
          </span>
          <span
            className={`inline-flex min-h-9 items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-bold dark:bg-navy-600 ${confidenceColor(report.confidence_key)}`}
          >
            <Eye className="h-3 w-3" />
            {t("scouting.confidence")}: {t(report.confidence_key)}
          </span>
        </div>
      </div>
    </article>
  );
}
