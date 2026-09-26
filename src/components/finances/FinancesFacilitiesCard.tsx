import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardBody, Button } from "../ui";
import { formatExactMoney } from "../../lib/helpers";
import { resolveBackendError } from "../../utils/backendI18n";
import type { TeamFinanceSnapshotData } from "../../services/financeService";
import {
  type FacilityId,
  type FacilityUpgradeErrorState,
  FACILITY_DEFINITIONS,
  getFacilityUpgradeCost,
  facilityUpgradeBlockReason,
} from "./FinancesTab.helpers";

interface FinancesFacilitiesCardProps {
  facilities: Record<"training" | "medical" | "scouting", number>;
  financeSnapshot: TeamFinanceSnapshotData;
  teamFinance: number;
  facilityUpgradeError: FacilityUpgradeErrorState | null;
  actionLoading: string | null;
  onUpgrade: (facility: FacilityId) => void;
}

export default function FinancesFacilitiesCard({
  facilities,
  financeSnapshot,
  teamFinance,
  facilityUpgradeError,
  actionLoading,
  onUpgrade,
}: FinancesFacilitiesCardProps) {
  const { t } = useTranslation();
  const financeBlockReason = facilityUpgradeBlockReason(financeSnapshot);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>{t("finances.facilities")}</CardHeader>
      <CardBody className="p-3 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {FACILITY_DEFINITIONS.map((facility) => {
            const level = facilities[facility.levelKey];
            const nextUpgradeCost = getFacilityUpgradeCost(level);
            const canAffordUpgrade = teamFinance >= nextUpgradeCost;
            const canUpgrade = canAffordUpgrade && !financeBlockReason;
            const isLoading = actionLoading === facility.id;
            const upgradeReason = financeBlockReason
              ? resolveBackendError(financeBlockReason)
              : facilityUpgradeError?.facilityId === facility.id
                ? facilityUpgradeError.message
                : null;

            return (
              <div
                key={facility.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-navy-600 dark:bg-navy-800 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3 md:block">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 sm:text-base">
                      {t(facility.titleKey)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t(facility.effectKey)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-heading font-bold text-gray-700 shadow-sm dark:bg-navy-700 dark:text-gray-200 md:mt-2 md:inline-block">
                    {t("finances.facilityLevel", { level })}
                  </span>
                </div>

                <div className="mt-auto space-y-2 border-t border-gray-200 pt-3 dark:border-navy-600">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {t("finances.nextUpgradeCost", { amount: formatExactMoney(nextUpgradeCost) })}
                    </p>
                  </div>
                  <Button
                    disabled={!canUpgrade || isLoading}
                    onClick={() => onUpgrade(facility.id)}
                    size="sm"
                    className="min-h-11 w-full md:min-h-0"
                  >
                    {t("finances.upgradeFacility")}
                  </Button>
                  {!canAffordUpgrade && !upgradeReason && (
                    <p className="text-xs text-red-500 dark:text-red-400">{t("finances.insufficientFunds")}</p>
                  )}
                  {upgradeReason && <p className="text-xs text-red-500 dark:text-red-400">{upgradeReason}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
