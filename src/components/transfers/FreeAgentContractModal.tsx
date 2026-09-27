import { useTranslation } from "react-i18next";
import type { PlayerData, TeamData } from "../../store/gameStore";
import type { FreeAgentContractProjection } from "../../services/freeAgentService";
import NegotiationFeedbackPanel, {
  type NegotiationFeedbackPanelData,
} from "../NegotiationFeedbackPanel";
import { Badge } from "../ui";
import { formatExactMoney, formatVal, getTeamName, positionBadgeVariant } from "../../lib/helpers";
import { translatePositionAbbreviation } from "../squad/SquadTab.helpers";
const MAX_CONTRACT_YEARS = 5;
export interface FreeAgentContractFormProps {
  player: PlayerData;
  teams: TeamData[];
  wage: string;
  onWageChange: (value: string) => void;
  contractLength: string;
  onContractLengthChange: (value: string) => void;
  projection: FreeAgentContractProjection | null;
  feedback: NegotiationFeedbackPanelData | null | undefined;
  statusMessage: string | null;
  statusClassName: string;
  submitting: boolean;
  submitDisabled: boolean;
  showPlayerSummary?: boolean;
  onSubmit: () => void;
  onClose: () => void;
}
type FreeAgentContractModalProps = FreeAgentContractFormProps;
export function FreeAgentContractForm({
  player,
  teams,
  wage,
  onWageChange,
  contractLength,
  onContractLengthChange,
  projection,
  feedback,
  statusMessage,
  statusClassName,
  submitting,
  submitDisabled,
  showPlayerSummary = true,
  onSubmit,
  onClose,
}: FreeAgentContractFormProps) {
  const { t } = useTranslation();
  const titleId = `free-agent-contract-title-${player.id}`;
  const formatRunway = (weeks: number | null | undefined): string =>
    weeks == null ? t("finances.runwayStable") : t("finances.runwayWeeks", { count: weeks });
  return (
    <>
      <h3
        id={titleId}
        className="mb-3 text-sm font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        {t("transfers.offerContract")}
      </h3>
      {showPlayerSummary ? (
        <div className="mb-4 flex min-w-0 items-center gap-3">
          <Badge variant={positionBadgeVariant(player.position)} size="sm">
            {translatePositionAbbreviation(t, player.position)}
          </Badge>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
              {player.full_name}
            </p>
            <p className="truncate text-xs text-gray-400">
              {player.team_id ? getTeamName(teams, player.team_id) : t("common.freeAgent")} •{" "}
              {t("transfers.playerValue", { value: formatVal(player.market_value) })}
            </p>
          </div>
        </div>
      ) : null}
      <label
        htmlFor="free-agent-wage"
        className="mb-1 block text-xs font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        {t("playerProfile.renewalWage")}
      </label>
      <input
        id="free-agent-wage"
        inputMode="numeric"
        type="number"
        min="0"
        step="1000"
        value={wage}
        onChange={(e) => onWageChange(e.target.value)}
        className="mb-3 min-h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-navy-600 dark:bg-navy-700 dark:text-gray-200 sm:min-h-0 sm:text-sm"
      />
      <label
        htmlFor="free-agent-years"
        className="mb-1 block text-xs font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        {t("playerProfile.renewalLength")}
      </label>
      <input
        id="free-agent-years"
        inputMode="numeric"
        type="number"
        min="1"
        max={String(MAX_CONTRACT_YEARS)}
        step="1"
        value={contractLength}
        onChange={(e) => onContractLengthChange(e.target.value)}
        className="mb-3 min-h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-navy-600 dark:bg-navy-700 dark:text-gray-200 sm:min-h-0 sm:text-sm"
      />
      {projection ? (
        <div className="mb-3 space-y-2 rounded-lg border border-gray-200 bg-white/70 p-3 dark:border-navy-700 dark:bg-navy-900/40">
          <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t("playerProfile.renewalProjectionTitle")}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t("playerProfile.renewalProjectionWageBill", {
              before: formatExactMoney(projection.current_weekly_wage_spend),
              after: formatExactMoney(projection.projected_weekly_wage_spend),
            })}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t("playerProfile.renewalProjectionBudgetUsage", {
              before: Math.round(
                (projection.current_annual_wage_bill / Math.max(projection.annual_wage_budget, 1)) *
                  100,
              ),
              after: Math.round(
                (projection.projected_annual_wage_bill /
                  Math.max(projection.annual_wage_budget, 1)) *
                  100,
              ),
            })}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t("playerProfile.renewalProjectionRunway", {
              before: formatRunway(projection.current_cash_runway_weeks),
              after: formatRunway(projection.projected_cash_runway_weeks),
            })}
          </p>
          {!projection.policy_allows ? (
            <p className="text-xs text-red-600 dark:text-red-300">
              {t("playerProfile.renewalBudgetWarning")}
            </p>
          ) : null}
        </div>
      ) : null}
      <NegotiationFeedbackPanel
        feedback={feedback ?? null}
        titleKey="playerProfile.renewalConversationTitle"
        roundKey="playerProfile.renewalRound"
        patienceKey="playerProfile.renewalPatience"
        tensionKey="playerProfile.renewalTension"
        className="mb-3"
      />
      {statusMessage ? (
        <div
          className={`mb-3 text-xs font-heading font-bold uppercase tracking-wider ${statusClassName}`}
        >
          {statusMessage}
        </div>
      ) : null}
      <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-2 bg-white/95 px-1 pb-[max(.25rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:bg-navy-800/95 sm:static sm:flex-row sm:bg-transparent sm:p-0">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-lg bg-gray-200 px-4 py-2 text-sm font-heading font-bold uppercase tracking-wider text-gray-600 active:bg-gray-300 dark:bg-navy-700 dark:text-gray-300 dark:active:bg-navy-600 sm:min-h-0"
        >
          {t("transfers.close")}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="min-h-12 flex-1 rounded-lg bg-primary-700 py-2 text-sm font-heading font-bold uppercase tracking-wider text-white active:bg-primary-800 disabled:opacity-50 sm:min-h-0"
        >
          {submitting ? t("transfers.submitting") : t("playerProfile.renewalSubmit")}
        </button>
      </div>
    </>
  );
}
export default function FreeAgentContractModal(props: FreeAgentContractModalProps) {
  const titleId = `free-agent-contract-title-${props.player.id}`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={props.onClose}
    >
      <div
        className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-navy-600 dark:bg-navy-800 sm:max-w-sm sm:rounded-xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <FreeAgentContractForm {...props} />
      </div>
    </div>
  );
}
