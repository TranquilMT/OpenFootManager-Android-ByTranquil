import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import DashboardModalFrame from "./dashboard/DashboardModalFrame";
import { Button } from "./ui";
interface SwitchClubConfirmModalProps {
  open: boolean;
  currentClubName: string;
  newClubName: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}
export default function SwitchClubConfirmModal({
  open,
  currentClubName,
  newClubName,
  busy = false,
  onCancel,
  onConfirm,
}: SwitchClubConfirmModalProps): JSX.Element | null {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <DashboardModalFrame maxWidthClassName="max-w-md">
      <div className="space-y-4" data-testid="switch-club-confirm-modal">
        <div>
          <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100">
            {t("jobs.switchConfirmTitle")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {t("jobs.switchConfirmBody", { currentClub: currentClubName, newClub: newClubName })}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-12 w-full"
            onClick={onCancel}
            disabled={busy}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-12 w-full"
            onClick={onConfirm}
            disabled={busy}
            data-testid="switch-club-confirm"
          >
            {t("jobs.switchConfirmAccept")}
          </Button>
        </div>
      </div>
    </DashboardModalFrame>
  );
}
