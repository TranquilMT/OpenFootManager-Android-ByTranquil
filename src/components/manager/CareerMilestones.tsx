import { useTranslation } from "react-i18next";
import type { CareerMilestone } from "../../store/types";
import { formatDate } from "../../lib/helpers";
import { Card, CardHeader, CardBody } from "../ui";

export default function CareerMilestones({ milestones }: { milestones: CareerMilestone[] }) {
  const { t, i18n } = useTranslation();
  const keys = {
    matches: "phase64.milestoneMatches",
    wins: "phase64.milestoneWins",
    trophies: "phase64.milestoneTrophies",
    anniversary: "phase64.milestoneAnniversary",
    promotion: "phase64.milestonePromotion",
  };
  return (
    <Card className="md:col-span-3">
      <CardHeader>{t("phase64.careerMilestones")}</CardHeader>
      <CardBody>
        {milestones.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("phase64.milestonePending")}
          </p>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-2">
            {[...milestones].reverse().map((milestone) => (
              <li
                key={milestone.id}
                className="rounded-lg border-l-4 border-primary-500 bg-gray-50 p-3 text-sm dark:bg-navy-800"
              >
                <p className="font-semibold">
                  {t(keys[milestone.kind], {
                    count: milestone.value,
                    season: milestone.value,
                    division: milestone.context ?? "",
                  })}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {milestone.date
                    ? formatDate(milestone.date, i18n.language)
                    : t("phase64.milestoneEarlier")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
