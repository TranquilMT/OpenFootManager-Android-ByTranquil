import type { ReactNode } from "react";
import { ArrowLeft, ArrowRightLeft, Gavel, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PlayerData, TeamData } from "../../store/gameStore";
import { countryName } from "../../lib/countries";
import {
  calcAge,
  formatAnnualAmount,
  formatVal,
  getPlayerOvr,
  getTeamName,
  positionBadgeVariant,
} from "../../lib/helpers";
import { translatePositionAbbreviation } from "../squad/SquadTab.helpers";
import { Badge, CountryFlag, PlayerAvatar } from "../ui";
export type DealKind = "transfer" | "loan" | "contract";
interface Props {
  player: PlayerData;
  teams: TeamData[];
  myTeam: TeamData | null;
  annualSuffix: string;
  transferWindowBlocksRegistration: boolean;
  transferWindowSummary: string;
  loanNoticeDetail: string | null;
  selectedKind: DealKind;
  offeredWage?: number | null;
  onSelectKind: (kind: DealKind) => void;
  onClose: () => void;
  renderDealPanel: (kind: DealKind) => ReactNode;
}
interface DealOption {
  kind: DealKind;
  title: string;
  description: string;
  detail: string;
  disabledReason: string | null;
  icon: ReactNode;
}
function routeButtonClass(selected: boolean, disabled: boolean) {
  const base =
    "min-h-14 shrink-0 rounded-xl px-3 py-2.5 text-left transition-colors lg:min-h-[88px] lg:w-full lg:py-3";
  if (disabled)
    return `${base} bg-gray-50 text-gray-500 opacity-70 dark:bg-navy-900/50 dark:text-gray-300`;
  if (selected)
    return `${base} bg-primary-50 text-gray-900 ring-1 ring-primary-400/40 dark:bg-primary-900/50 dark:text-white`;
  return `${base} bg-white text-gray-700 active:bg-gray-100 dark:bg-navy-800 dark:text-gray-300 dark:active:bg-navy-700`;
}
const label = () =>
  "text-xs font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300";
const value = () => "mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100";
export default function PlayerDealWorkspace(p: Props) {
  const { t, i18n } = useTranslation(),
    age = calcAge(p.player.date_of_birth),
    ovr = getPlayerOvr(p.player),
    teamName = p.player.team_id ? getTeamName(p.teams, p.player.team_id) : t("common.freeAgent");
  const options: DealOption[] = [
    {
      kind: "transfer",
      title: t("transfers.makeBid"),
      description: t("transfers.dealTransferDescription"),
      detail: p.player.transfer_listed
        ? t("transfers.dealAvailableTransfer")
        : t("transfers.dealUnavailableTransfer"),
      disabledReason: !p.player.transfer_listed
        ? t("transfers.dealUnavailableTransfer")
        : p.transferWindowBlocksRegistration
          ? p.transferWindowSummary
          : null,
      icon: <Gavel className="h-4 w-4" />,
    },
    {
      kind: "loan",
      title: t("transfers.makeLoanOffer"),
      description: t("transfers.dealLoanDescription"),
      detail: p.player.loan_listed
        ? (p.loanNoticeDetail ?? t("transfers.dealAvailableLoan"))
        : t("transfers.dealUnavailableLoan"),
      disabledReason: !p.player.loan_listed
        ? t("transfers.dealUnavailableLoan")
        : p.transferWindowBlocksRegistration
          ? p.transferWindowSummary
          : null,
      icon: <ArrowRightLeft className="h-4 w-4" />,
    },
    {
      kind: "contract",
      title: t("transfers.offerContract"),
      description: t("transfers.dealContractDescription"),
      detail:
        p.player.team_id === null
          ? t("transfers.dealAvailableContract")
          : t("transfers.dealUnavailableContract"),
      disabledReason: p.player.team_id === null ? null : t("transfers.dealUnavailableContract"),
      icon: <UserPlus className="h-4 w-4" />,
    },
  ];
  const selected = options.find((o) => o.kind === p.selectedKind) ?? options[0];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-deal-workspace-title"
      className="fixed inset-0 z-50 bg-gray-100 text-gray-900 dark:bg-navy-900 dark:text-gray-100"
    >
      <div className="flex h-[100dvh] min-h-0 flex-col">
        <header className="shrink-0 border-b border-gray-200 bg-white px-3 pb-2 pt-[max(.75rem,env(safe-area-inset-top))] shadow-sm dark:border-navy-600 dark:bg-navy-800 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={p.onClose}
              className="-ml-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 active:bg-gray-100 dark:text-gray-300 dark:active:bg-navy-700"
              aria-label={t("common.back")}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden font-heading font-bold uppercase tracking-wider sm:inline">
                {t("common.back")}
              </span>
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
              <PlayerAvatar
                player={p.player}
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-sm font-heading font-bold text-gray-500 dark:bg-navy-700 dark:text-gray-300 sm:h-16 sm:w-16"
                imageClassName="h-full w-full object-cover object-top"
              />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h2
                    id="player-deal-workspace-title"
                    className="truncate font-heading text-lg font-bold uppercase tracking-wide text-gray-950 dark:text-white sm:text-2xl"
                  >
                    {p.player.full_name}
                  </h2>
                  <Badge
                    variant={positionBadgeVariant(p.player.natural_position || p.player.position)}
                    size="sm"
                  >
                    {translatePositionAbbreviation(
                      t,
                      p.player.natural_position || p.player.position,
                    )}
                  </Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-2 overflow-hidden whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-300 sm:flex-wrap sm:text-xs">
                  <span>{age}</span>
                  <span className="flex items-center gap-1">
                    <CountryFlag
                      code={p.player.nationality}
                      locale={i18n.language}
                      className="text-sm leading-none"
                    />
                    {countryName(p.player.nationality, i18n.language)}
                  </span>
                  <span className="truncate">{teamName}</span>
                  <span className="hidden sm:inline">{p.transferWindowSummary}</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] lg:grid lg:grid-cols-[260px_minmax(0,1fr)_280px] lg:gap-4 lg:overflow-hidden lg:p-4">
          <nav
            aria-label={t("transfers.dealType")}
            className="touch-x sticky top-0 z-20 flex gap-2 border-b border-gray-200 bg-gray-100/95 p-2 backdrop-blur dark:border-navy-700 dark:bg-navy-900/95 lg:static lg:block lg:space-y-3 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
          >
            {options.map((o) => {
              const d = !!o.disabledReason,
                s = o.kind === p.selectedKind;
              return (
                <button
                  key={o.kind}
                  type="button"
                  disabled={d}
                  onClick={() => p.onSelectKind(o.kind)}
                  className={routeButtonClass(s, d)}
                  aria-pressed={s}
                >
                  <span className="flex items-center gap-2 lg:items-start lg:gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${d ? "bg-gray-200 dark:bg-navy-700" : s ? "bg-primary-700 text-white" : "bg-gray-100 dark:bg-navy-700"}`}
                    >
                      {o.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="whitespace-nowrap font-heading text-xs font-bold uppercase tracking-wider lg:text-sm">
                        {o.title}
                      </span>
                      <span className="hidden lg:mt-1 lg:block lg:text-xs lg:text-gray-500">
                        {o.disabledReason ?? o.description}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
          <section className="min-h-0 bg-white p-4 dark:bg-navy-800 sm:p-5 lg:overflow-y-auto lg:rounded-lg">
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{selected.detail}</p>
            {selected.disabledReason ? (
              <div className="flex min-h-[220px] flex-col justify-center rounded-lg bg-gray-50 p-5 text-center dark:bg-navy-900/50">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-gray-500 dark:bg-navy-700">
                  {selected.icon}
                </div>
                <p className="font-heading text-lg font-bold uppercase">{selected.title}</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
                  {selected.description}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-red-600 dark:text-red-300">
                  {selected.disabledReason}
                </p>
              </div>
            ) : (
              p.renderDealPanel(p.selectedKind)
            )}
          </section>
          <aside className="space-y-3 p-3 sm:p-4 lg:min-h-0 lg:overflow-y-auto lg:p-0">
            <div className="rounded-lg bg-white p-4 dark:bg-navy-800">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className={label()}>{t("common.ovr")}</p>
                  <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-primary-500">
                    {ovr}
                  </p>
                </div>
                <div>
                  <p className={label()}>{t("common.value")}</p>
                  <p className={`${value()} tabular-nums`}>{formatVal(p.player.market_value)}</p>
                </div>
                <div>
                  <p className={label()}>{t("common.currentWage")}</p>
                  <p className={`${value()} tabular-nums`}>
                    {formatAnnualAmount(formatVal(p.player.wage), p.annualSuffix)}
                  </p>
                </div>
              </div>
              {p.offeredWage != null && p.offeredWage > 0 ? (
                <div className="mt-3 border-t border-gray-100 pt-3 dark:border-navy-700">
                  <p className={label()}>{t("playerProfile.renewalWage")}</p>
                  <p className={`${value()} tabular-nums`}>
                    {formatAnnualAmount(formatVal(p.offeredWage), p.annualSuffix)}
                  </p>
                </div>
              ) : null}
            </div>
            {p.myTeam ? (
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-white p-4 dark:bg-navy-800">
                <div>
                  <p className={label()}>{t("finances.transferBudget")}</p>
                  <p className={`${value()} tabular-nums`}>{formatVal(p.myTeam.transfer_budget)}</p>
                </div>
                <div>
                  <p className={label()}>{t("finances.wageBudget")}</p>
                  <p className={`${value()} tabular-nums`}>
                    {formatAnnualAmount(formatVal(p.myTeam.wage_budget), p.annualSuffix)}
                  </p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
