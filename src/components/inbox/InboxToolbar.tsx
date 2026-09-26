import { CheckCheck, Trash2 } from "lucide-react";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";

import { Badge, Button, Select } from "../ui";
import {
  getCategoryIcon,
  getFilterButtonClassName,
  type MessageSortOrder,
  UNREAD_FILTER,
} from "./inboxHelpers";

interface InboxToolbarProps {
  allMessagesCount: number;
  bulkSelectionEnabled: boolean;
  categories: string[];
  categoryCounts: Map<string, number>;
  categoryFilter: string | null;
  selectedMessageCount: number;
  sortOrder: MessageSortOrder;
  unreadCount: number;
  onClearOld: () => void;
  onDeleteSelected: () => void;
  onMarkAllRead: () => void;
  onShowAll: () => void;
  onShowUnread: () => void;
  onSortOrderChange: (sortOrder: MessageSortOrder) => void;
  onToggleBulkSelectionMode: () => void;
  onToggleCategory: (category: string) => void;
}

export default function InboxToolbar({
  allMessagesCount,
  bulkSelectionEnabled,
  categories,
  categoryCounts,
  categoryFilter,
  selectedMessageCount,
  sortOrder,
  unreadCount,
  onClearOld,
  onDeleteSelected,
  onMarkAllRead,
  onShowAll,
  onShowUnread,
  onSortOrderChange,
  onToggleBulkSelectionMode,
  onToggleCategory,
}: InboxToolbarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="mb-3 flex shrink-0 flex-col gap-2 sm:mb-4">\n      <div className="touch-x -mx-1 flex gap-2 px-1 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        type="button"
        onClick={onShowAll}
        className={getFilterButtonClassName(!categoryFilter, "min-h-11 shrink-0 sm:min-h-0")}
      >
        {t("common.all")} ({allMessagesCount})
      </button>
      {unreadCount > 0 ? (
        <button
          type="button"
          onClick={onShowUnread}
          className={getFilterButtonClassName(categoryFilter === UNREAD_FILTER, "min-h-11 shrink-0 sm:min-h-0")}
        >
          {t("inbox.unread", { count: unreadCount })}
        </button>
      ) : null}
      {categories.map((category) => {
        const categoryIcon = getCategoryIcon(category);
        const count = categoryCounts.get(category) ?? 0;

        return (
          <button
            type="button"
            key={category}
            onClick={() => onToggleCategory(category)}
            className={getFilterButtonClassName(
              categoryFilter === category,
              "flex min-h-11 shrink-0 items-center gap-1.5 sm:min-h-0",
            )}
          >
            {categoryIcon} {t(`inbox.categories.${category}`)} ({count})
          </button>
        );
      })}

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <label
            htmlFor="inbox-sort-order"
            className="text-xs font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            {t("inbox.sortLabel")}
          </label>
          <Select
            id="inbox-sort-order"
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value as MessageSortOrder)}
            selectSize="sm"
            wrapperClassName="min-w-0 flex-1 sm:min-w-[170px]"\n            className="min-h-11 sm:min-h-0"
            aria-label={t("inbox.sortByDate")}
          >
            <option value="newest">{t("inbox.sortNewest")}</option>
            <option value="oldest">{t("inbox.sortOldest")}</option>
          </Select>
        </div>
        <Button
          type="button"
          variant={bulkSelectionEnabled ? "primary" : "outline"}
          size="sm"
          onClick={onToggleBulkSelectionMode}
          data-testid="inbox-toggle-selection-mode"
        >
          {bulkSelectionEnabled ? t("inbox.cancelSelection") : t("inbox.selectMessages")}
        </Button>
        {bulkSelectionEnabled ? (
          <>
            <Badge variant="neutral" size="sm">
              {t("inbox.selectedCount", {
                count: selectedMessageCount,
              })}
            </Badge>
            <Button
              type="button"
              size="sm"
              onClick={onDeleteSelected}
              disabled={selectedMessageCount === 0}
              icon={<Trash2 className="w-4 h-4" />}
              className="min-h-11 w-full bg-red-500 hover:bg-red-600 active:bg-red-700 focus:ring-red-500 sm:min-h-0 sm:w-auto"
              data-testid="inbox-delete-selected"
            >
              {t("inbox.deleteSelected")}
            </Button>
          </>
        ) : null}
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider text-gray-500 transition-all active:text-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-400 sm:min-h-0 sm:w-auto"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t("inbox.markAllRead")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClearOld}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider text-gray-500 transition-all active:text-red-500 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-400 sm:min-h-0 sm:w-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t("inbox.clearOld")}
        </button>
      </div>
    </div>
  );
}
