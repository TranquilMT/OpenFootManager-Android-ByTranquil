import { Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatAppVersion, isNightlyBuild } from "../../lib/appVersion";

export function MainMenuFooter() {
  const { t } = useTranslation();
  return (
    <footer className="pointer-events-none fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-20 flex items-center justify-between gap-3 sm:left-4 sm:right-4">
      <div className="min-w-0">
        {isNightlyBuild() && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500/40 bg-primary-500/10 px-2 py-1 font-heading text-xs font-bold tracking-widest text-primary-700 dark:text-primary-300">
            <Moon aria-hidden="true" className="size-3 shrink-0" />
            {t("phase66.nightlyBadge")}
          </span>
        )}
      </div>
      <span className="shrink-0 whitespace-nowrap font-heading text-xs tracking-wide text-gray-500 dark:text-gray-400">
        {formatAppVersion()}
      </span>
    </footer>
  );
}
