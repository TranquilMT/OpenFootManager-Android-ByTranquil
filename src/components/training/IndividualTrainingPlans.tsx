import { useTranslation } from "react-i18next";
import type { PlayerData } from "../../store/types";
import { Card, CardHeader, CardBody, Badge, ProgressBar } from "../ui";
import { individualMonthlyGoal } from "./individualGoals";

export default function IndividualTrainingPlans({ players }: { players: PlayerData[] }) {
  const { t } = useTranslation();
  const plans = players.filter((player) => player.training_focus && !player.retired);
  return (
    <Card>
      <CardHeader>{t("phase64.individualPlans")}</CardHeader>
      <CardBody>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {t("phase64.individualPlansHint")}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {plans.map((player) => {
            const goal = individualMonthlyGoal(player);
            return (
              <li
                key={player.id}
                className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm dark:bg-navy-800"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{player.full_name}</span>
                  <Badge variant="neutral">
                    {t(`training.focuses.${player.training_focus}.label`)}
                  </Badge>
                </div>
                <p>
                  {goal.status === "new"
                    ? t("phase64.newTrainingPlan")
                    : goal.status === "ceiling"
                      ? t("phase64.trainingCeiling")
                      : t("phase64.monthlyTarget", { target: goal.target })}
                </p>
                {goal.status !== "new" && goal.status !== "ceiling" && (
                  <ProgressBar
                    value={goal.progress}
                    variant={goal.status === "complete" ? "success" : "primary"}
                    showLabel
                  />
                )}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
