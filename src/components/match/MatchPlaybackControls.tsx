import { useTranslation } from "react-i18next";
import { Play, Pause, FastForward, SkipForward, ChevronRight } from "lucide-react";
import type { SimSpeed } from "./types";
export default function MatchPlaybackControls({
  speed,
  disabled,
  onSpeedChange,
  onStep,
}: {
  speed: SimSpeed;
  disabled: boolean;
  onSpeedChange: (speed: SimSpeed) => void;
  onStep: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="px-3 py-2 landscape:w-1/2">
      <div className="flex gap-1">
        {[
          {
            id: "paused" as SimSpeed,
            icon: <Pause className="w-4 h-4" />,
            label: t("match.pause"),
          },
          {
            id: "slow" as SimSpeed,
            icon: <Play className="w-4 h-4" />,
            label: t("match.slow"),
          },
          {
            id: "normal" as SimSpeed,
            icon: <Play className="w-4 h-4" />,
            label: t("match.normal"),
          },
          {
            id: "fast" as SimSpeed,
            icon: <FastForward className="w-4 h-4" />,
            label: t("match.fast"),
          },
          {
            id: "instant" as SimSpeed,
            icon: <SkipForward className="w-4 h-4" />,
            label: t("match.max"),
          },
        ].map((s) => (
          <button
            type="button"
            key={s.id}
            aria-pressed={speed === s.id}
            disabled={disabled}
            onClick={() => onSpeedChange(s.id)}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-xs font-heading uppercase tracking-wider transition-all ${
              speed === s.id
                ? "bg-primary-500/20 text-primary-500 dark:text-primary-400 ring-1 ring-primary-500/50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
            }`}
          >
            {s.icon}
            <span className="text-[10px]">{s.label}</span>
          </button>
        ))}
      </div>
      {speed === "paused" && (
        <button
          type="button"
          disabled={disabled}
          onClick={onStep}
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg text-sm font-heading uppercase tracking-wider text-gray-700 dark:text-gray-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          {t("match.step1Min")}
        </button>
      )}
    </div>
  );
}
