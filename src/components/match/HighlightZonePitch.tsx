import { useTranslation } from "react-i18next";
import { ballZonePosition } from "./livePitchModel";
export default function HighlightZonePitch({ zone }: { zone: string }) {
  const { t } = useTranslation();
  const x = ballZonePosition(zone);
  return (
    <figure className="m-0 min-w-0" aria-label={t("match.pitchView")}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-primary-800 dark:bg-primary-900">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 70"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full text-white/60"
        >
          <g fill="none" stroke="currentColor" strokeWidth=".4">
            <rect x="3" y="3" width="94" height="64" />
            <path d="M50 3V67 M3 19H17V51H3 M97 19H83V51H97" />
            <circle cx="50" cy="35" r="9" />
          </g>
        </svg>
        {x !== null && (
          <span
            aria-hidden="true"
            data-recorded-ball
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-navy-900 bg-white shadow transition-[left] duration-700 dark:border-navy-900 dark:bg-white"
            style={{ left: `${x}%` }}
          />
        )}
      </div>
      <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {t("match.highlights.recordedZones")}
      </figcaption>
    </figure>
  );
}
