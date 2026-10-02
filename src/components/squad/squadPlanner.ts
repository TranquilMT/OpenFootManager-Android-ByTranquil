import type { PlayerData } from "../../store/types";
import { getDaysUntil } from "../../lib/contractUtils";
import { isSeniorSquadPlayer } from "../../lib/playerSquad";
import { buildRoleCoverageSummary, buildStartingXIIds } from "./SquadTab.helpers";

export function buildSquadPlan(players: PlayerData[], formation: string, today: string) {
  const seniors = players.filter((player) => !player.retired && isSeniorSquadPlayer(player));
  const expiring = seniors
    .filter(
      (player) =>
        player.contract_end && getDaysUntil(player.contract_end, today.slice(0, 10)) <= 180,
    )
    .sort((a, b) => (a.contract_end ?? "").localeCompare(b.contract_end ?? ""));
  const departures = new Set(expiring.map((player) => player.id));
  const projected = seniors.filter((player) => !departures.has(player.id));
  const xi = buildStartingXIIds(projected, [], formation);
  return {
    expiring,
    projectedCount: projected.length,
    coverage: buildRoleCoverageSummary(projected, xi, formation),
  };
}
