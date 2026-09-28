import type { JSX } from "react";
import { useTranslation } from "react-i18next";

import DashboardModalFrame from "../dashboard/DashboardModalFrame";
import { Button } from "../ui";
import type { DeleteModalState } from "./inboxHelpers";

interface InboxDeleteConfirmModalProps {
  deleteModalState: DeleteModalState;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function InboxDeleteConfirmModal({
  deleteModalState,
  isDeleting,
  onCancel,
  onConfirm,
}: InboxDeleteConfirmModalProps): JSX.Element | null {
  const { t } = useTranslation();

  if (!deleteModalState) {
    return null;
  }

  const title =
    deleteModalState.mode === "single"
      ? t("inbox.deleteMessageTitle")
      : t("inbox.deleteSelectedTitle");
  const message =
    deleteModalState.mode === "single"
      ? t("inbox.deleteMessageBody", { subject: deleteModalState.subject })
      : t("inbox.deleteSelectedBody", { count: deleteModalState.messageIds.length });

  return (
    <DashboardModalFrame maxWidthClassName="max-w-md">
      <div className="space-y-4" data-testid="inbox-delete-confirm-modal">
        <div>
          <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="mt-2 break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-h-12 w-full bg-red-500 hover:bg-red-600 active:bg-red-700 focus:ring-red-500"
            data-testid="inbox-confirm-delete"
          >
            {t("inbox.deleteAction")}
          </Button>
        </div>
      </div>
    </DashboardModalFrame>
  );
}
