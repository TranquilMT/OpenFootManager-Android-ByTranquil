import { useTranslation } from "react-i18next";
import type { GameStateData } from "../../store/types";
import { formatDate, getTeamName } from "../../lib/helpers";
import { getDaysUntil } from "../../lib/contractUtils";
import { Card, CardHeader, CardBody, Badge } from "../ui";
import { monitoredLoans } from "./loanMonitoring";
import { developmentReport } from "../youthAcademy/developmentReport";

export default function LoanMonitoringCard({
  gameState,
  onSelectPlayer,
}: {
  gameState: GameStateData;
  onSelectPlayer?: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const teamId = gameState.manager.team_id;
  if (!teamId) return null;
  const loans = monitoredLoans(gameState.players, teamId);
  if (loans.length === 0) return null;
  const today = gameState.clock.current_date.slice(0, 10);
  return (
    <Card className="mb-4">
      <CardHeader>{t("phase64.loanWatch")}</CardHeader>
      <CardBody>
        <ul className="grid gap-3 sm:grid-cols-2">
          {loans.map(({ player, loan, appearances, minutes, hasBaseline }) => {
            const report = developmentReport(player, gameState.league?.season ?? 0);
            const unused = hasBaseline && minutes === 0 && getDaysUntil(today, loan.start_date.slice(0, 10)) >= 14;
            return (
              <li
                key={player.id}
                className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm dark:bg-navy-800"
              >
                {onSelectPlayer ? (
                  <button
                    type="button"
                    className="min-h-11 text-left font-semibold text-primary-700 dark:text-primary-300"
                    onClick={() => onSelectPlayer(player.id)}
                  >
                    {player.full_name}
                  </button>
                ) : (
                  <p className="font-semibold">{player.full_name}</p>
                )}
                <p className="text-gray-600 dark:text-gray-300">
                  {getTeamName(gameState.teams, loan.loan_team_id)}
                </p>
                <p>{hasBaseline ? t("phase64.loanSeasonStats", { appearances, minutes }) : "—"}</p>
                <p>
                  {t("phase64.loanReturnDate", {
                    date: formatDate(loan.end_date, i18n.language),
                    count: Math.max(0, getDaysUntil(loan.end_date, today)),
                  })}
                </p>
                {report.growth !== null && (
                  <p>
                    {t("phase64.reviewGrowth", {
                      value: `${report.growth >= 0 ? "+" : ""}${report.growth}`,
                    })}
                  </p>
                )}
                {unused && <Badge variant="accent">{t("phase64.loanUnused")}</Badge>}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
