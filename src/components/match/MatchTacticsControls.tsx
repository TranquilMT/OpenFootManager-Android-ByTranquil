import { useTranslation } from "react-i18next";
import type { TacticsPhaseSettings } from "../../store/types";
import { Select } from "../ui";
import { PhaseBlueprintPanel } from "../tactics/PhaseBlueprintPanel";
import { FORMATIONS, PLAY_STYLES, type EngineTeamData } from "./types";

export default function MatchTacticsControls({
  team,
  disabled,
  onFormationChange,
  onPlayStyleChange,
  onTacticsPhaseChange,
}: {
  team: EngineTeamData;
  disabled: boolean;
  onFormationChange: (formation: string) => void;
  onPlayStyleChange: (style: string) => void;
  onTacticsPhaseChange?: (patch: Partial<TacticsPhaseSettings>) => void;
}) {
  const { t } = useTranslation();
  const formations = FORMATIONS.includes(team.formation)
    ? FORMATIONS
    : [team.formation, ...FORMATIONS];
  return (
    <section aria-label={t("match.tacticsTab")} className="min-h-0 overflow-auto">
      <div className="flex flex-wrap gap-3 border-b border-gray-200 p-4 dark:border-navy-700">
        <fieldset className="min-w-0 flex-1 space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <legend>{t("tactics.formation")}</legend>
          <Select
            value={team.formation}
            onChange={(event) => onFormationChange(event.target.value)}
            disabled={disabled}
            aria-label={t("tactics.formation")}
          >
            {formations.map((formation) => (
              <option key={formation} value={formation}>
                {formation}
              </option>
            ))}
          </Select>
        </fieldset>
        <fieldset className="min-w-0 flex-1 space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <legend>{t("tactics.playStyle")}</legend>
          <Select
            value={team.play_style}
            onChange={(event) => onPlayStyleChange(event.target.value)}
            disabled={disabled}
            aria-label={t("tactics.playStyle")}
          >
            {PLAY_STYLES.map((style) => (
              <option key={style} value={style}>
                {t(`common.playStyles.${style}`)}
              </option>
            ))}
          </Select>
        </fieldset>
      </div>
      {onTacticsPhaseChange && (
        <PhaseBlueprintPanel
          tacticsPhase={team.tactics}
          onTacticsPhaseChange={onTacticsPhaseChange}
          disabled={disabled}
        />
      )}
    </section>
  );
}
