import { useTranslation } from "react-i18next";
import type { HighlightMode } from "./highlightModel";
export type HighlightPreference = HighlightMode | "off";
export default function HighlightModeControls({
  value,
  onChange,
}: {
  value: HighlightPreference;
  onChange: (mode: HighlightPreference) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("match.highlights.title")}
      className="flex shrink-0 flex-wrap gap-2 p-2"
    >
      {(["key", "extended", "off"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${value === mode ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-white" : "bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-gray-200"}`}
        >
          {t(mode === "off" ? "match.events" : `match.highlights.${mode}`)}
        </button>
      ))}
    </div>
  );
}
