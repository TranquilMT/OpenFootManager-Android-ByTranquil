import { useTranslation } from "react-i18next";
import type { PlayerData, PlayerSelectionOptions } from "../../store/types";
import { formatDate } from "../../lib/helpers";
import { Card, CardHeader, CardBody, Badge, Button } from "../ui";
import { translatePositionAbbreviation } from "./SquadTab.helpers";
import { buildSquadPlan } from "./squadPlanner";

export default function SquadPlanningCard({
  players,
  formation,
  today,
  onSelectPlayer,
}: {
  players: PlayerData[];
  formation: string;
  today: string;
  onSelectPlayer: (id: string, options?: PlayerSelectionOptions) => void;
}) {
  const { t, i18n } = useTranslation();
  const plan = buildSquadPlan(players, formation, today);
  return (
    <Card className="mb-4">
      <CardHeader>{t("phase64.squadPlan")}</CardHeader>
      <CardBody>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {t("phase64.squadPlanHint", { count: plan.projectedCount })}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {plan.coverage.map((role) => (
            <Badge
              key={role.role}
              variant={
                role.status === "covered" ? "success" : role.status === "thin" ? "accent" : "danger"
              }
            >
              {translatePositionAbbreviation(t, role.role)}:{" "}
              {t("squad.coverageBadge", {
                starters: role.naturalStarters,
                required: role.requiredSlots,
                bench: role.benchOptions,
              })}
            </Badge>
          ))}
        </div>
        {plan.returningLoans.length > 0 && (
          <section className="mb-4">
            <h3 className="mb-2 text-sm font-semibold">{t("phase73.loanReturns")}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {plan.returningLoans.map((player) => (
                <li
                  key={player.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 dark:bg-navy-800"
                >
                  <div className="text-sm">
                    <p className="font-semibold">{player.full_name}</p>
                    <p>
                      {player.active_loan
                        ? formatDate(player.active_loan.end_date, i18n.language)
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectPlayer(player.id)}
                  >
                    {t("squad.viewProfile")}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {plan.expiring.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("phase64.noExpiringContracts")}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {plan.expiring.map((player) => (
              <li
                key={player.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 dark:bg-navy-800"
              >
                <div className="text-sm">
                  <p className="font-semibold">{player.full_name}</p>
                  <p>{player.contract_end ? formatDate(player.contract_end, i18n.language) : ""}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectPlayer(player.id, { openRenewal: true })}
                >
                  {t("common.renewContract")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
