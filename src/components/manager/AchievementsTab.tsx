import { useTranslation } from "react-i18next";
import type { ManagerData } from "../../store/types";
import { formatDate } from "../../lib/helpers";
import { Card, CardHeader, CardBody } from "../ui";
import { ACHIEVEMENTS, managerProgress } from "./achievementCatalog";

export default function AchievementsTab({ manager }: { manager: ManagerData }) {
  const { t, i18n } = useTranslation();
  const progress = managerProgress(manager.career_stats);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>{t("phase64.achievements")}</CardHeader>
        <CardBody>
          <p className="text-xl font-semibold">
            {t("phase64.managerLevel", { level: progress.level })}
          </p>
          <p>{t("phase64.managerXp", { xp: progress.xp })}</p>
          {progress.next !== null && (
            <p>{t("phase64.nextLevel", { xp: progress.next - progress.xp })}</p>
          )}
          <p className="mt-3">
            {t("phase64.managerPerks", {
              training: progress.training,
              performance: progress.performance,
            })}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t("phase64.achievementRules")}
          </p>
        </CardBody>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = progress.unlocked.find((entry) => entry.id === achievement.id);
          return (
            <Card key={achievement.id}>
              <CardHeader>{t(`phase64.achievementNames.${achievement.id}`)}</CardHeader>
              <CardBody>
                <p>{t(`phase64.achievementGoals.${achievement.id}`)}</p>
                <p className="mt-2 font-semibold">
                  {t("phase64.managerXp", { xp: achievement.xp })}
                </p>
                <p className="mt-1 text-sm">
                  {earned
                    ? t("phase64.achievementEarned", {
                        date: formatDate(earned.date, i18n.language),
                      })
                    : t("phase64.achievementPending")}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
