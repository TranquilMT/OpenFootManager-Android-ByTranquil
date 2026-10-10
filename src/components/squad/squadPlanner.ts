import type { PlayerData } from "../../store/types";
import { getDaysUntil } from "../../lib/contractUtils";
import { isSeniorSquadPlayer } from "../../lib/playerSquad";
import { buildRoleCoverageSummary, buildStartingXIIds } from "./SquadTab.helpers";

export function buildSquadPlan(players: PlayerData[], formation: string, today: string) {
  const seen = new Set<string>();
  const seniors = players.filter((player) => {
    if(player.retired || !isSeniorSquadPlayer(player) || !player.id || seen.has(player.id)) return false;
    seen.add(player.id); return true;
  });
  const expiring = seniors
    .filter(
      (player) =>
        !(player.active_loan && player.active_loan.loan_team_id===player.team_id && player.active_loan.parent_team_id!==player.team_id) &&
        player.contract_end && getDaysUntil(player.contract_end, today.slice(0, 10)) <= 180,
    )
    .sort((a, b) => (a.contract_end ?? "").localeCompare(b.contract_end ?? ""));
  const returningLoans = seniors.filter(player=>player.active_loan
    && player.active_loan.loan_team_id===player.team_id
    && player.active_loan.parent_team_id!==player.team_id
    && getDaysUntil(player.active_loan.end_date,today.slice(0,10))<=180);
  const departures = new Set([...expiring,...returningLoans].map((player) => player.id));
  const projected = seniors.filter((player) => !departures.has(player.id));
  const xi = buildStartingXIIds(projected, [], formation);
  return {
    expiring,
    returningLoans,
    projectedCount: projected.length,
    coverage: buildRoleCoverageSummary(projected, xi, formation),
  };
}
