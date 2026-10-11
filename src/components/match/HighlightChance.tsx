import { useTranslation } from "react-i18next";
import type { MatchEvent } from "./types";
export default function HighlightChance({ frame }: { frame: MatchEvent }) {
  const { t } = useTranslation();
  const xg = frame.shot?.expected_goals;
  if (xg === undefined || !Number.isFinite(xg) || xg < 0 || xg > 1) return null;
  return (
    <p className="text-xs text-gray-600 dark:text-gray-300">
      {t("match.analysis.recordedShots")}: <strong>{xg.toFixed(2)}</strong>
    </p>
  );
}
