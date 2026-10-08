import type { PlayerData } from "../../store/types";
import { annualAmountToWeeklyCommitment, getPlayerAnnualWageCommitment } from "../../lib/finance";
import { getDaysUntil } from "../../lib/contractUtils";

interface ForecastInput {
  cash: number;
  weeklyNet: number;
  weeklyWages: number;
  teamId: string;
  today: string;
  weeks: number;
  players: PlayerData[];
}

/** Linear recurring-cash estimate plus already agreed registration commitments. */
export function projectClubCash({
  cash,
  weeklyNet,
  weeklyWages,
  teamId,
  today,
  weeks,
  players,
}: ForecastInput) {
  let projectedCash = cash + weeklyNet * weeks;
  let projectedWages = weeklyWages;
  let transferNet = 0;
  const credited = new Set<string>();
  const apply = (id: string, date: string, fee: number, wageChange: number) => {
    if (credited.has(id)) return false;
    credited.add(id);
    const days = Math.max(0, getDaysUntil(date.slice(0, 10), today.slice(0, 10)));
    if (!Number.isFinite(days) || days > weeks * 7) return false;
    transferNet += fee;
    projectedCash += fee - wageChange * (weeks - days / 7);
    projectedWages += wageChange;
    return true;
  };
  for (const player of players) {
    if (player.team_id === teamId && !player.active_loan && player.contract_end) {
      const expiryDays = getDaysUntil(player.contract_end.slice(0, 10), today.slice(0, 10));
      const leavesBeforeExpiry = player.transfer_offers.some((offer) => offer.status === "PendingRegistration" && offer.from_team_id !== teamId && getDaysUntil((offer.registration_date ?? offer.date).slice(0, 10), today.slice(0, 10)) <= expiryDays);
      if (!leavesBeforeExpiry) apply(`expiry:${player.id}`, player.contract_end, 0, -annualAmountToWeeklyCommitment(getPlayerAnnualWageCommitment(player, teamId)));
    }
    const loan = player.active_loan;
    if (loan && (loan.parent_team_id === teamId || loan.loan_team_id === teamId)) {
      const contractDays = player.contract_end ? getDaysUntil(player.contract_end.slice(0, 10), today.slice(0, 10)) : Infinity;
      const returnDays = getDaysUntil(loan.end_date.slice(0, 10), today.slice(0, 10));
      const currentWage = annualAmountToWeeklyCommitment(getPlayerAnnualWageCommitment(player, teamId));
      const afterReturnWage = loan.parent_team_id === teamId ? annualAmountToWeeklyCommitment(player.wage) : 0;
      if (returnDays < contractDays) apply(`return:${player.id}`, loan.end_date, 0, afterReturnWage - currentWage);
      if (player.contract_end) apply(`expiry:${player.id}`, player.contract_end, 0, -(returnDays < contractDays ? afterReturnWage : currentWage));
    }
    for (const offer of player.transfer_offers) {
      if (offer.status !== "PendingRegistration") continue;
      if (offer.from_team_id === teamId && player.team_id !== teamId) {
        apply(
          `transfer:${offer.id}`,
          offer.registration_date ?? offer.date,
          -offer.fee,
          annualAmountToWeeklyCommitment(offer.wage_offered || player.wage),
        );
      } else if (player.team_id === teamId && offer.from_team_id !== teamId) {
        apply(
          `transfer:${offer.id}`,
          offer.registration_date ?? offer.date,
          offer.fee,
          -annualAmountToWeeklyCommitment(getPlayerAnnualWageCommitment(player, teamId)),
        );
      }
    }
    for (const offer of player.loan_offers ?? []) {
      if (offer.status !== "PendingRegistration") continue;
      const contribution = annualAmountToWeeklyCommitment(
        Math.floor((player.wage * offer.wage_contribution_pct) / 100),
      );
      const wageChange = offer.from_team_id === teamId ? contribution : offer.parent_team_id === teamId ? -contribution : 0;
      if (wageChange !== 0 && apply(`loan:${offer.id}`, offer.start_date, 0, wageChange)) {
        const startDays = getDaysUntil(offer.start_date.slice(0, 10), today.slice(0, 10));
        const endDays = getDaysUntil(offer.end_date.slice(0, 10), today.slice(0, 10));
        if (endDays >= startDays) apply(`loan-end:${offer.id}`, offer.end_date, 0, -wageChange);
      }
    }
  }
  return { cash: Math.round(projectedCash), weeklyWages: Math.max(0, projectedWages), transferNet };
}
