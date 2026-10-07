import { Activity, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
export function EngineUpdateBanner({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-11 w-full items-center gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 p-3 text-left text-primary-700 dark:text-primary-300"
    >
      <Activity aria-hidden="true" className="size-6 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-lg font-bold">
          0.7.0 · {t("phase70.release.title")}
        </span>
        <span className="text-xs">{t("settings.whatsNew")}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
    </button>
  );
}
