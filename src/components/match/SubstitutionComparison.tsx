import { useTranslation } from "react-i18next";
import { UserMinus, UserPlus } from "lucide-react";
import type { EnginePlayerData } from "./types";
const CompareBar = ({ label, valA, valB }: { label: string; valA: number; valB: number }) => {
  valA = Number.isFinite(valA) ? Math.round(Math.max(0, Math.min(100, valA))) : 0;
  valB = Number.isFinite(valB) ? Math.round(Math.max(0, Math.min(100, valB))) : 0;
  const diff = valB - valA;
  return (
    <div className="flex items-center gap-1.5 py-0.5 text-xs">
      <span className="w-20 break-words text-right font-heading text-gray-500">{label}</span>
      <span className="w-5 text-right tabular-nums text-red-400">{valA}</span>
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-navy-600">
        <div className="h-full bg-red-500/60" style={{ width: `${valA}%` }} />
      </div>
      <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-navy-600">
        <div className="h-full bg-green-500/60" style={{ width: `${valB}%` }} />
      </div>
      <span className="w-5 tabular-nums text-green-400">{valB}</span>
      <span
        className={`w-6 text-right tabular-nums font-heading font-bold ${diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-gray-600"}`}
      >
        {diff > 0 ? "+" : ""}
        {diff}
      </span>
    </div>
  );
};

export default function SubstitutionComparison({
  selectedPlayer,
  comparedPlayer,
  disabled,
  onClear,
  onConfirm,
}: {
  selectedPlayer?: EnginePlayerData | null;
  comparedPlayer?: EnginePlayerData | null;
  disabled: boolean;
  onClear: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 border-t border-gray-200 bg-gray-50/60 px-4 py-3 dark:border-navy-700 dark:bg-navy-900/30">
      {selectedPlayer && comparedPlayer ? (
        <div>
          {/* Player names + position match + action buttons */}
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <UserMinus className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span className="max-w-[110px] truncate font-heading text-sm font-bold text-red-400">
                {selectedPlayer.name}
              </span>
              <span className="text-gray-400">→</span>
              <span className="max-w-[110px] truncate font-heading text-sm font-bold text-green-400">
                {comparedPlayer.name}
              </span>
              <UserPlus className="h-3.5 w-3.5 shrink-0 text-green-400" />
            </div>
            <span
              className={`font-heading text-[10px] font-bold uppercase tracking-wide ${
                comparedPlayer.position === selectedPlayer.position
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {comparedPlayer.position === selectedPlayer.position
                ? t("match.fitExact")
                : t("match.fitAdjusted")}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClear}
                className="min-h-11 rounded-lg border border-gray-300 px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-wider text-gray-700 transition-colors hover:bg-gray-100 dark:border-navy-500 dark:text-gray-300 dark:hover:bg-navy-600"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={onConfirm}
                className="min-h-11 rounded-lg bg-green-500 px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-green-400"
              >
                {t("match.confirmSubstitution")}
              </button>
            </div>
          </div>
          {/* Attribute comparison bars */}
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <CompareBar
              label={t("common.ovr")}
              valA={selectedPlayer.ovr}
              valB={comparedPlayer.ovr}
            />
            <CompareBar
              label={t("common.attributes.pace")}
              valA={selectedPlayer.pace}
              valB={comparedPlayer.pace}
            />
            <CompareBar
              label={t("common.attributes.passing")}
              valA={selectedPlayer.passing}
              valB={comparedPlayer.passing}
            />
            <CompareBar
              label={t("common.attributes.shooting")}
              valA={selectedPlayer.shooting}
              valB={comparedPlayer.shooting}
            />
            <CompareBar
              label={t("common.attributes.tackling")}
              valA={selectedPlayer.tackling}
              valB={comparedPlayer.tackling}
            />
            <CompareBar
              label={t("common.condition")}
              valA={Math.round(selectedPlayer.condition)}
              valB={Math.round(comparedPlayer.condition)}
            />
          </div>
        </div>
      ) : selectedPlayer ? (
        <div className="flex items-center gap-2">
          <UserMinus className="h-3.5 w-3.5 text-red-400" />
          <span className="font-heading text-sm font-bold text-red-400">{selectedPlayer.name}</span>
          <span className="text-gray-400">—</span>
          <span className="font-heading text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("match.selectBenchToCompare")}
          </span>
        </div>
      ) : (
        <p className="text-center font-heading text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {t("match.selectPlayerOff")}
        </p>
      )}
    </div>
  );
}
