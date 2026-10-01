import { expectedPromiseDeadline } from "./promiseTracker";
import { formatDate } from "../../lib/helpers";
import { useTranslation } from "react-i18next";
import type { GameStateData } from "../../store/gameStore";
import { Card, CardHeader, CardBody, ProgressBar } from "../ui";

export default function DressingRoomPanel({ gameState }: { gameState: GameStateData }) {
  const { t, i18n } = useTranslation();
  const players = gameState.players.filter(
    (player) => player.team_id === gameState.manager.team_id && !player.retired,
  );
  if (!gameState.manager.team_id || players.length === 0) return null;
  const issues = players.filter(
    (player) =>
      player.morale < 40 ||
      player.morale_core?.unresolved_issue ||
      player.morale_core?.pending_promise ||
      player.transfer_listed,
  );
  const fixtures = [
    ...(gameState.competitions ?? []).flatMap((league) => league.fixtures),
    ...(gameState.league?.fixtures ?? []),
  ];
  const average = Math.round(
    players.reduce((total, player) => total + player.morale, 0) / players.length,
  );
  return (
    <Card className="md:col-span-3">
      <CardHeader>{t("phase6.dressingRoom")}</CardHeader>
      <CardBody>
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm">
            {t("common.morale")}: {average}%
          </span>
          <div className="flex-1">
            <ProgressBar value={average} variant="auto" />
          </div>
        </div>
        {issues.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {issues.map((player) => {
              const promise = player.morale_core?.pending_promise;
              const deadline = promise
                ? expectedPromiseDeadline(
                    fixtures,
                    gameState.manager.team_id ?? "",
                    gameState.clock.current_date.slice(0, 10),
                    promise.matches_remaining,
                    Boolean(player.injury),
                  )
                : null;
              return (
                <li key={player.id} className="rounded-lg bg-gray-100 p-3 text-sm dark:bg-navy-700">
                  <p className="font-semibold">{player.match_name}</p>
                  <p>
                    {t("common.morale")}: {player.morale}%
                  </p>
                  {player.morale_core?.unresolved_issue && (
                    <p>
                      {t("phase6.concerns")}:{" "}
                      {t(
                        player.morale_core.unresolved_issue.category === "Contract"
                          ? "common.contract"
                          : player.morale_core.unresolved_issue.category === "PlayingTime"
                            ? "phase6.playingTime"
                            : "common.morale",
                        { count: player.morale_core.pending_promise?.matches_remaining ?? 0 },
                      )}
                    </p>
                  )}
                  {player.morale_core?.pending_promise && (
                    <div className="mt-2 border-t border-gray-200 pt-2 dark:border-navy-600">
                      <p>
                        {t("phase64.promiseAction", { count: promise?.matches_remaining ?? 0 })}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {player.injury
                          ? t("phase64.promisePaused")
                          : deadline
                            ? t("phase64.promiseDeadline", {
                                date: formatDate(deadline, i18n.language),
                              })
                            : t("phase64.promiseUnscheduled")}
                      </p>
                    </div>
                  )}
                  {player.transfer_listed && <p>{t("transfers.listed")}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
