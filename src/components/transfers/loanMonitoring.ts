import type { PlayerData } from "../../store/types";

export function monitoredLoans(players: PlayerData[], teamId: string) {
  return players
    .flatMap((player) => {
      const loan = player.active_loan;
      if (
        player.retired ||
        !loan ||
        (loan.parent_team_id !== teamId && loan.loan_team_id !== teamId)
      )
        return [];
      return [
        {
          player,
          loan,
          appearances: Math.max(0, player.stats.appearances - (loan.loan_start_appearances ?? 0)),
          minutes: Math.max(0, player.stats.minutes_played - (loan.loan_start_minutes ?? 0)),
        },
      ];
    })
    .sort((a, b) => a.loan.end_date.localeCompare(b.loan.end_date));
}
