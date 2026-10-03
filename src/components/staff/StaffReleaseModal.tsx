import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatExactMoney } from "../../lib/helpers";
import { previewStaffRelease } from "../../services/staffService";
import { resolveTranslatedErrorMessage } from "../../utils/errorMessage";
import DashboardModalFrame from "../dashboard/DashboardModalFrame";
import { Button } from "../ui";

interface Props {
  staffId: string;
  staffName: string;
  submitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function StaffReleaseModal({
  staffId,
  staffName,
  submitting,
  errorMessage,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [cost, setCost] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const reportError = useEffectEvent((error: unknown) =>
    setPreviewError(resolveTranslatedErrorMessage(error, t)),
  );
  useEffect(() => {
    let active = true;
    setCost(null);
    setPreviewError(null);
    void previewStaffRelease(staffId)
      .then((value) => {
        if (active) setCost(value);
      })
      .catch((error: unknown) => {
        if (active) reportError(error);
      });
    return () => {
      active = false;
    };
  }, [staffId]);

  return (
    <DashboardModalFrame maxWidthClassName="max-w-lg">
      <h2 className="font-heading text-lg font-bold">{t("staff.releaseStaff")}</h2>
      <p className="mt-2 text-sm">
        {t("playerProfile.terminateContractBody", { name: staffName })}
      </p>
      <p className="my-4 font-semibold">
        {t("playerProfile.terminationSeverance")}:{" "}
        {cost === null ? t("common.loading") : formatExactMoney(cost)}
      </p>
      {errorMessage || previewError ? (
        <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-300">
          {errorMessage || previewError}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={submitting} onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button disabled={cost === null || submitting} onClick={onConfirm}>
          {t("staff.releaseStaff")}
        </Button>
      </div>
    </DashboardModalFrame>
  );
}
