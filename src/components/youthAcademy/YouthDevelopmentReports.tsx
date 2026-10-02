import { useTranslation } from "react-i18next";
import type { PlayerData } from "../../store/types";
import { formatDate } from "../../lib/helpers";
import { Card, CardHeader, CardBody, Badge } from "../ui";
import { developmentReport } from "./developmentReport";

export default function YouthDevelopmentReports({
  players,
  season,
}: {
  players: PlayerData[];
  season: number;
}) {
  const { t, i18n } = useTranslation();
  if (players.length === 0) return null;
  return (
    <Card>
      <CardHeader>{t("phase64.youthReviews")}</CardHeader>
      <CardBody>
        <ul className="grid gap-3 sm:grid-cols-2">
          {players.map((player) => {
            const report = developmentReport(player, season);
            return (
              <li key={player.id} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-navy-800">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{player.full_name}</span>
                  <Badge variant={report.readiness === "ready" ? "success" : "neutral"}>
                    {t(
                      report.readiness === "ready"
                        ? "phase64.promotionReady"
                        : "phase64.developing",
                    )}
                  </Badge>
                </div>
                {report.date ? (
                  <>
                    <p>
                      {t("phase64.reviewDate", { date: formatDate(report.date, i18n.language) })}
                    </p>
                    <p>
                      {t("phase64.reviewGrowth", {
                        value: `${(report.growth ?? 0) >= 0 ? "+" : ""}${report.growth}`,
                      })}
                    </p>
                    <p>{t("phase64.reviewMinutes", { count: report.minutes ?? 0 })}</p>
                  </>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">{t("phase64.reviewPending")}</p>
                )}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
