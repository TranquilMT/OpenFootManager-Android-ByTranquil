import { Activity, Target, Hand, Goal } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MatchSnapshot } from "./types";
import { matchMetrics } from "./narrativeContext";

export function MatchPulse({
  snapshot,
  derby = false,
}: {
  snapshot: MatchSnapshot;
  derby?: boolean;
}) {
  const { t } = useTranslation();
  const home = matchMetrics(snapshot.events, "Home");
  const away = matchMetrics(snapshot.events, "Away");
  const recent = snapshot.events.filter(
    (e) => e.minute > snapshot.current_minute - 5 && e.minute <= snapshot.current_minute,
  );
  const homeRecent = matchMetrics(recent, "Home").shots;
  const awayRecent = matchMetrics(recent, "Away").shots;
  const leader =
    homeRecent === awayRecent
      ? null
      : homeRecent > awayRecent
        ? snapshot.home_team.name
        : snapshot.away_team.name;
  const rows = [
    {
      label: t("phase70.metrics.xg"),
      Icon: Target,
      h: home.hasXg ? home.xg.toFixed(2) : "—",
      a: away.hasXg ? away.xg.toFixed(2) : "—",
    },
    { label: t("phase70.metrics.saves"), Icon: Hand, h: home.saves, a: away.saves },
    { label: t("phase70.metrics.woodwork"), Icon: Goal, h: home.woodwork, a: away.woodwork },
  ];
  return (
    <section
      aria-label={t("phase70.metrics.pulse")}
      className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-navy-600 dark:bg-navy-800"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
        <Activity aria-hidden="true" className="size-4 text-primary-500" />
        <span>{t(derby ? "phase70.metrics.derby" : "phase70.metrics.pulse")}</span>
        <span className="ml-auto truncate text-primary-600 dark:text-primary-400">
          {leader ? `${t("phase70.metrics.pressure")}: ${leader}` : t("phase70.metrics.even")}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {rows.map(({ label, Icon, h, a }) => (
          <div key={label} className="min-w-0 rounded-lg bg-white p-2 dark:bg-navy-700">
            <Icon aria-hidden="true" className="mb-1 size-4 text-gray-500" />
            <p className="break-words text-[10px] leading-tight text-gray-600 dark:text-gray-300">
              {label}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              <span className="text-primary-600 dark:text-primary-400">{h}</span>
              <span className="px-1 text-gray-400">:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{a}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
        {t("phase70.metrics.shotsLast5")}: {homeRecent} : {awayRecent}
      </p>
      <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
        {t("phase70.metrics.qualityHint")}
      </p>
    </section>
  );
}
