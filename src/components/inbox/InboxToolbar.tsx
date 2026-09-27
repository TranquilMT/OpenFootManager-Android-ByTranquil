import { CheckCheck, Trash2 } from "lucide-react";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";

import { Badge, Button, Select } from "../ui";
import { getCategoryIcon, getFilterButtonClassName, type MessageSortOrder, UNREAD_FILTER } from "./inboxHelpers";

interface InboxToolbarProps {
  allMessagesCount: number; bulkSelectionEnabled: boolean; categories: string[]; categoryCounts: Map<string, number>; categoryFilter: string | null; selectedMessageCount: number; sortOrder: MessageSortOrder; unreadCount: number;
  onClearOld: () => void; onDeleteSelected: () => void; onMarkAllRead: () => void; onShowAll: () => void; onShowUnread: () => void; onSortOrderChange: (sortOrder: MessageSortOrder) => void; onToggleBulkSelectionMode: () => void; onToggleCategory: (category: string) => void;
}

export default function InboxToolbar({ allMessagesCount, bulkSelectionEnabled, categories, categoryCounts, categoryFilter, selectedMessageCount, sortOrder, unreadCount, onClearOld, onDeleteSelected, onMarkAllRead, onShowAll, onShowUnread, onSortOrderChange, onToggleBulkSelectionMode, onToggleCategory }: InboxToolbarProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="mb-2 flex shrink-0 flex-col gap-2 sm:mb-4">
      <div className="-mx-2 overflow-x-auto overscroll-x-contain px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-2">
          <button type="button" onClick={onShowAll} className={getFilterButtonClassName(!categoryFilter, "min-h-9 shrink-0 whitespace-nowrap rounded-full px-3 sm:min-h-0")}>{t("common.all")} ({allMessagesCount})</button>
          {unreadCount > 0 ? <button type="button" onClick={onShowUnread} className={getFilterButtonClassName(categoryFilter === UNREAD_FILTER, "min-h-9 shrink-0 whitespace-nowrap rounded-full px-3 sm:min-h-0")}>{t("inbox.unread", { count: unreadCount })}</button> : null}
          {categories.map((category) => <button type="button" key={category} onClick={() => onToggleCategory(category)} className={getFilterButtonClassName(categoryFilter === category, "flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 sm:min-h-0")}>{getCategoryIcon(category)} {t(`inbox.categories.${category}`)} ({categoryCounts.get(category) ?? 0})</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
        <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1 sm:mr-auto"><label htmlFor="inbox-sort-order" className="shrink-0 text-[11px] font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t("inbox.sortLabel")}</label><Select id="inbox-sort-order" value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as MessageSortOrder)} selectSize="sm" wrapperClassName="min-w-0 flex-1 sm:min-w-[170px] sm:flex-none" className="min-h-10 sm:min-h-0" aria-label={t("inbox.sortByDate")}><option value="newest">{t("inbox.sortNewest")}</option><option value="oldest">{t("inbox.sortOldest")}</option></Select></div>
        <Button type="button" variant={bulkSelectionEnabled ? "primary" : "outline"} size="sm" onClick={onToggleBulkSelectionMode} className="min-h-10 w-full sm:min-h-0 sm:w-auto" data-testid="inbox-toggle-selection-mode">{bulkSelectionEnabled ? t("inbox.cancelSelection") : t("inbox.selectMessages")}</Button>
        {bulkSelectionEnabled ? <><Badge variant="neutral" size="sm">{t("inbox.selectedCount", { count: selectedMessageCount })}</Badge><Button type="button" size="sm" onClick={onDeleteSelected} disabled={selectedMessageCount === 0} icon={<Trash2 className="w-4 h-4" />} className="min-h-10 w-full bg-red-500 hover:bg-red-600 active:bg-red-700 focus:ring-red-500 sm:min-h-0 sm:w-auto" data-testid="inbox-delete-selected">{t("inbox.deleteSelected")}</Button></> : null}
        {unreadCount > 0 ? <button type="button" onClick={onMarkAllRead} className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-heading font-bold uppercase tracking-wide text-gray-500 transition-all active:text-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-400 sm:min-h-0 sm:w-auto sm:px-3"><CheckCheck className="h-3.5 w-3.5" />{t("inbox.markAllRead")}</button> : null}
        <button type="button" onClick={onClearOld} className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-heading font-bold uppercase tracking-wide text-gray-500 transition-all active:text-red-500 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-400 sm:min-h-0 sm:w-auto sm:px-3"><Trash2 className="h-3.5 w-3.5" />{t("inbox.clearOld")}</button>
      </div>
    </div>
  );
}
