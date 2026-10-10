import { estimatedRecoveryDate } from "../../lib/recoveryEstimate";
import { AlertTriangle } from "lucide-react";
import { resolvePlayerInjuryName } from "./PlayerProfile.helpers";
import { Card, CardBody } from "../ui";
import type { TOptions } from "i18next";

type TranslateFn = (key: string, options?: TOptions) => string;

interface PlayerProfileInjuryBannerProps {
  injury: {
    name: string;
    days_remaining: number;
  };
  t: TranslateFn;
  currentDate: string;
}

export default function PlayerProfileInjuryBanner({ injury, t, currentDate }: PlayerProfileInjuryBannerProps) {
  const recoveryDate = estimatedRecoveryDate(currentDate, injury.days_remaining);
  return (
    <Card accent="danger" className="mb-5">
      <CardBody>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-red-600 dark:text-red-400">
              {resolvePlayerInjuryName(injury.name, t)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("playerProfile.daysRemaining", {
                count: injury.days_remaining,
              })}
            </p>
            {recoveryDate && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("phase73.expectedRecovery", {date: recoveryDate})}</p>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
