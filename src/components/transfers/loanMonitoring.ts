import type { PlayerData } from "../../store/types";

export function monitoredLoans(players: PlayerData[], teamId: string) {
  const seen = new Set<string>();
  return players
    .flatMap((player) => {
      const loan = player.active_loan;
      if (
        seen.has(player.id) ||
        player.retired ||
        !loan ||
        !teamId ||
        !player.id ||
        !loan.parent_team_id ||
        !loan.loan_team_id ||
        loan.parent_team_id === loan.loan_team_id ||
        (loan.parent_team_id !== teamId && loan.loan_team_id !== teamId)
      )
        return [];
      seen.add(player.id);
      const hasBaseline =
        Number.isSafeInteger(loan.loan_start_appearances) &&
        (loan.loan_start_appearances ?? -1) >= 0 &&
        Number.isSafeInteger(loan.loan_start_minutes) &&
        (loan.loan_start_minutes ?? -1) >= 0 &&
        Number.isSafeInteger(player.stats.appearances) &&
        player.stats.appearances >= 0 &&
        Number.isSafeInteger(player.stats.minutes_played) &&
        player.stats.minutes_played >= 0 &&
        player.stats.appearances >= (loan.loan_start_appearances ?? 0) &&
        player.stats.minutes_played >= (loan.loan_start_minutes ?? 0);
      return [
        {
          player,
          loan,
          hasBaseline,
          appearances: hasBaseline
            ? Math.max(0, player.stats.appearances - (loan.loan_start_appearances ?? 0))
            : 0,
          minutes: hasBaseline
            ? Math.max(0, player.stats.minutes_played - (loan.loan_start_minutes ?? 0))
            : 0,
        },
      ];
    })
    .sort(
      (a, b) =>
        a.loan.end_date.localeCompare(b.loan.end_date) || a.player.id.localeCompare(b.player.id),
    );
}
