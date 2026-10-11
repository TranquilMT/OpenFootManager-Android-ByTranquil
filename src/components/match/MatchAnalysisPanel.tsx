import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardBody } from "../ui";
import { analyzeMatch } from "./matchAnalysis";
import type { MatchSnapshot } from "./types";
export default function MatchAnalysisPanel({ snapshot }: { snapshot: MatchSnapshot }) {
  const { t } = useTranslation();
  const home = analyzeMatch(snapshot.events, "Home", snapshot.current_minute);
  const away = analyzeMatch(snapshot.events, "Away", snapshot.current_minute);
  const rows = [
    {
      label: t("match.analysis.bigChances"),
      value: (analysis: typeof home) => (analysis.recordedShots ? analysis.bigChances : "—"),
    },
    {
      label: t("match.analysis.recordedShots"),
      value: (analysis: typeof home) => `${analysis.recordedShots}/${analysis.metrics.shots}`,
    },
    {
      label: t("match.analysis.adjustments"),
      value: (analysis: typeof home) => analysis.tacticalChanges,
    },
    {
      label: t("match.analysis.afterSubs"),
      value: (analysis: typeof home) =>
        analysis.afterSubstitution
          ? `${analysis.afterSubstitution.shots} / ${analysis.afterSubstitution.conceded}`
          : "—",
    },
  ];
  return (
    <Card className="col-span-2">
      <CardHeader>{t("match.analysis.title")}</CardHeader>
      <CardBody>
        <table className="w-full text-sm text-gray-800 dark:text-gray-200">
          <thead>
            <tr>
              <th scope="col" className="text-left">
                {t("match.analysis.metric")}
              </th>
              <th scope="col">{snapshot.home_team.name}</th>
              <th scope="col">{snapshot.away_team.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-gray-200 dark:border-navy-600">
                <th scope="row" className="py-2 text-left font-normal">
                  {row.label}
                </th>
                <td className="text-center tabular-nums">{row.value(home)}</td>
                <td className="text-center tabular-nums">{row.value(away)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          {t("match.analysis.explanation")}
        </p>
        {[
          { team: snapshot.home_team, analysis: home },
          { team: snapshot.away_team, analysis: away },
        ].map(
          ({ team, analysis }) =>
            analysis.afterSubstitution && (
              <p key={team.id} className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {t("match.analysis.since", {
                  team: team.name,
                  minute: analysis.afterSubstitution.minute,
                })}
              </p>
            ),
        )}
      </CardBody>
    </Card>
  );
}
