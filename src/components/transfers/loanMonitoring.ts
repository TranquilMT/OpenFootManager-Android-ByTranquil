import type { PlayerData } from "../../store/types";

export function monitoredLoans(players: PlayerData[], teamId: string) {
  return players
    .flatMap((player) => {
      const loan = player.active_loan;
      if (
        player.retired ||
        !loan ||
        (loan.parent_team_id !== teamId && loan.loan_team_id !== teamId)
      ) return [];
      const hasBaseline = Number.isFinite(loan.loan_start_appearances) && Number.isFinite(loan.loan_start_minutes) && Number.isFinite(player.stats.appearances) && Number.isFinite(player.stats.minutes_played);
      return [
        {
          player,
          loan,
          hasBaseline,
          appearances: hasBaseline ? Math.max(0, player.stats.appearances - (loan.loan_start_appearances ?? 0)) : 0,
          minutes: hasBaseline ? Math.max(0, player.stats.minutes_played - (loan.loan_start_minutes ?? 0)) : 0,
        },
      ];
    })
    .sort((a, b) => a.loan.end_date.localeCompare(b.loan.end_date));
}
