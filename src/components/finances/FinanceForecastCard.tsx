import { useTranslation } from "react-i18next";
import type { PlayerData, TeamData } from "../../store/types";
import { formatExactMoney } from "../../lib/helpers";
import { Card, CardHeader, CardBody } from "../ui";
import { projectClubCash } from "./financeForecast";

export default function FinanceForecastCard({
  team,
  players,
  today,
  weeklyNet,
  weeklyWages,
}: {
  team: TeamData;
  players: PlayerData[];
  today: string;
  weeklyNet: number;
  weeklyWages: number;
}) {
  const { t } = useTranslation();
  return (
    <Card className="lg:col-span-3">
      <CardHeader>{t("phase64.financeForecast")}</CardHeader>
      <CardBody>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{t("phase64.forecastHint")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("phase64.financeForecast")}</caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  {t("phase64.forecastPeriod")}
                </th>
                <th scope="col" className="p-2">
                  {t("finances.clubBalance")}
                </th>
                <th scope="col" className="p-2">
                  {t("finances.wageBill")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[4, 12, 26].map((weeks) => {
                const forecast = projectClubCash({
                  cash: team.finance,
                  weeklyNet,
                  weeklyWages,
                  teamId: team.id,
                  today,
                  weeks,
                  players,
                });
                return (
                  <tr key={weeks} className="border-t border-gray-200 dark:border-navy-600">
                    <th scope="row" className="p-2 font-medium">
                      {t("phase64.forecastWeeks", { count: weeks })}
                    </th>
                    <td
                      className={`p-2 ${forecast.cash < 0 ? "font-semibold text-red-700 dark:text-red-300" : ""}`}
                    >
                      {formatExactMoney(forecast.cash)}
                    </td>
                    <td className="p-2">{formatExactMoney(forecast.weeklyWages)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
