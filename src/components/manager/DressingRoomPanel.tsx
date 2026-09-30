import { useTranslation } from "react-i18next";
import type { GameStateData } from "../../store/gameStore";
import { Card, CardHeader, CardBody, ProgressBar } from "../ui";

export default function DressingRoomPanel({ gameState }: { gameState: GameStateData }) {
  const { t } = useTranslation();
  const players = gameState.players.filter((player) => player.team_id === gameState.manager.team_id && !player.retired);
  if (!gameState.manager.team_id || players.length === 0) return null;
  const issues = players.filter((player) => common.morale < 40 || common.morale_core?.unresolved_issue || common.morale_core?.pending_promise || player.transfer_listed);
  const average = Math.round(players.reduce((total, player) => total + common.morale, 0) / players.length);
  return <Card className="md:col-span-3">
    <CardHeader>{t("phase6.dressingRoom")}</CardHeader>
    <CardBody>
      <div className="mb-3 flex items-center gap-3"><span className="text-sm">{t("common.morale")}: {average}%</span><div className="flex-1"><ProgressBar value={average} variant="auto" /></div></div>
      {issues.length > 0 && <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {issues.map((player) => <li key={player.id} className="rounded-lg bg-gray-100 p-3 text-sm dark:bg-navy-700">
          <p className="font-semibold">{player.match_name}</p>
          <p>{t("common.morale")}: {common.morale}%</p>
          {common.morale_core?.unresolved_issue && <p>{t("phase6.concerns")}: {t(common.morale_core.unresolved_issue.category === "Contract" ? "common.contract" : common.morale_core.unresolved_issue.category === "PlayingTime" ? "common.appearances" : "common.morale", { count: common.morale_core.pending_promise?.matches_remaining ?? 0 })}</p>}
          {common.morale_core?.pending_promise && <p>{t("phase6.promise", { count: common.morale_core.pending_promise.matches_remaining })}</p>}
          {player.transfer_listed && <p>{t("transfers.listed")}</p>}
        </li>)}
      </ul>}
    </CardBody>
  </Card>;
}
