import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Users } from "lucide-react";
import type { GameStateData, PlayerData, TeamData } from "../../store/gameStore";
import {
  setPlayerTrainingFocus,
  setTrainingGroups,
  type TrainingGroupData,
} from "../../services/trainingService";
import { translatePositionAbbreviation } from "../squad/SquadTab.helpers";
import { condColor } from "../../lib/playerConditionDisplay";
import { Card, CardBody, CardHeader, Select } from "../ui";
import {
  buildPlayerGroupMap,
  reassignPlayerTrainingGroup,
  sortTrainingRoster,
} from "./trainingGroupsModel";
type TrainingGroup = TrainingGroupData;
interface Props {
  team: TeamData | null;
  onGameUpdate?: (state: GameStateData) => void;
  roster: PlayerData[];
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  trainingFocusIds: readonly string[];
  trainingFocusIcons: Record<string, React.ReactNode>;
}
export default function TrainingGroupsCard({
  team,
  onGameUpdate,
  roster,
  isSaving,
  setIsSaving,
  trainingFocusIds,
  trainingFocusIcons,
}: Props) {
  const { t } = useTranslation(),
    groups: TrainingGroup[] = team?.training_groups ?? [],
    teamFocus = team?.training_focus || "Physical";
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const saveGroups = useCallback(
    async (next: TrainingGroup[]) => {
      setIsSaving(true);
      try {
        onGameUpdate?.(await setTrainingGroups(next));
      } catch (e) {
        console.error("Failed to save training groups:", e);
      } finally {
        setIsSaving(false);
      }
    },
    [onGameUpdate, setIsSaving],
  );
  const addGroup = () => {
    if (groups.length >= 5) return;
    const i = groups.length;
    void saveGroups([
      ...groups,
      {
        id: `grp_${Date.now()}`,
        name: t(`training.groups.defaultGroupNames.${i}`),
        focus: "Physical",
        player_ids: [],
      },
    ]);
  };
  const removeGroup = (id: string) => void saveGroups(groups.filter((g) => g.id !== id));
  const updateGroupFocus = (id: string, focus: string) =>
    void saveGroups(groups.map((g) => (g.id === id ? { ...g, focus } : g)));
  const updateGroupName = (id: string, name: string) =>
    void saveGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));
  const setPlayerFocus = async (id: string, focus: string) => {
    setIsSaving(true);
    try {
      onGameUpdate?.(await setPlayerTrainingFocus(id, focus || null));
    } catch (e) {
      console.error("Failed to set player training focus:", e);
    } finally {
      setIsSaving(false);
    }
  };
  const setPlayerGroup = (id: string, gid: string) =>
    void saveGroups(reassignPlayerTrainingGroup(groups, id, gid));
  const map = buildPlayerGroupMap(groups),
    sorted = sortTrainingRoster(roster);
  return (
    <Card>
      <CardHeader
        action={
          groups.length < 5 ? (
            <button
              type="button"
              onClick={addGroup}
              disabled={isSaving}
              className="flex min-h-11 items-center gap-1.5 px-2 text-xs font-heading font-bold uppercase tracking-wider text-primary-500 active:text-primary-400 disabled:opacity-50 sm:min-h-0 sm:px-0"
            >
              <Plus className="h-4 w-4" />
              {t("training.groups.addGroup")}
            </button>
          ) : null
        }
      >
        {t("training.groups.trainingGroups")}
      </CardHeader>
      <CardBody>
        {groups.length > 0 ? (
          <div className="touch-x -mx-1 mb-4 flex gap-2 px-1 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {groups.map((g) => (
              <div
                key={g.id}
                className="w-[82vw] max-w-[19rem] shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-navy-600 dark:bg-navy-700/50 sm:w-auto sm:max-w-none"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-gray-400">
                    {trainingFocusIcons[g.focus] ? (
                      <span className="[&>svg]:h-4 [&>svg]:w-4">{trainingFocusIcons[g.focus]}</span>
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </span>
                  <input
                    type="text"
                    value={draftNames[g.id] ?? g.name}
                    disabled={isSaving}
                    onChange={(e) => setDraftNames((drafts) => ({...drafts, [g.id]: e.target.value}))}
                    onBlur={(e) => {
                      if (e.target.value !== g.name) updateGroupName(g.id, e.target.value);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-base font-heading font-bold uppercase tracking-wider text-gray-800 outline-none dark:text-gray-200 sm:text-xs"
                  />
                  <span className="text-xs tabular-nums text-gray-400">{g.player_ids.length}</span>
                  <button
                    type="button"
                    aria-label={t("training.groups.removeGroup")}
                    onClick={() => removeGroup(g.id)}
                    disabled={isSaving}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-red-400 active:bg-red-500/10 disabled:opacity-50 sm:h-8 sm:w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Select
                  value={g.focus}
                  onChange={(e) => updateGroupFocus(g.id, e.target.value)}
                  disabled={isSaving}
                  variant="muted"
                  fullWidth
                >
                  {trainingFocusIds.map((id) => (
                    <option key={id} value={id}>
                      {t(`training.focuses.${id}.label`)}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {t("training.groups.noGroups")}
          </p>
        )}
        {roster.length > 0 ? (
          <>
            <div className="space-y-2 md:hidden">
              {sorted.map((player) => {
                const pg = map.get(player.id),
                  individual = !!player.training_focus,
                  fallback = pg ? pg.focus : teamFocus;
                return (
                  <article
                    key={player.id}
                    className="rounded-xl border border-gray-200 p-3 dark:border-navy-600"
                  >
                    <div className="mb-3 flex min-w-0 items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-heading font-bold text-gray-800 dark:text-gray-200">
                          {player.match_name}
                          {player.jersey_number != null ? ` (#${player.jersey_number})` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {translatePositionAbbreviation(
                            t,
                            player.natural_position || player.position,
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-heading font-bold tabular-nums ${condColor(player.condition)}`}
                      >
                        {Math.round(player.condition)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-gray-400">
                        {t("training.groups.group")}
                        <Select
                          value={pg?.id || ""}
                          onChange={(e) => setPlayerGroup(player.id, e.target.value)}
                          disabled={isSaving}
                          variant="muted"
                          fullWidth
                          wrapperClassName="mt-1 w-full"
                        >
                          <option value="">{t("training.groups.teamDefault")}</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-gray-400">
                        {t("training.effectiveFocus")}
                        <Select
                          value={player.training_focus || ""}
                          onChange={(e) => void setPlayerFocus(player.id, e.target.value)}
                          disabled={isSaving}
                          variant={individual ? "highlighted" : "placeholder"}
                          fullWidth
                          wrapperClassName="mt-1 w-full"
                        >
                          <option value="">{t(`training.focuses.${fallback}.label`)} ↩</option>
                          {trainingFocusIds.map((id) => (
                            <option key={id} value={id}>
                              {t(`training.focuses.${id}.label`)}
                            </option>
                          ))}
                        </Select>
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-navy-600 md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-navy-700/50">
                    {[
                      t("common.player"),
                      t("common.position"),
                      t("common.condition"),
                      t("training.groups.group"),
                      t("training.effectiveFocus"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-[10px] font-heading font-bold uppercase tracking-widest text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-600">
                  {sorted.map((player) => {
                    const pg = map.get(player.id),
                      individual = !!player.training_focus,
                      fallback = pg ? pg.focus : teamFocus;
                    return (
                      <tr key={player.id}>
                        <td className="max-w-[160px] truncate px-3 py-1.5 font-medium">
                          {player.match_name}
                          {player.jersey_number != null ? ` (#${player.jersey_number})` : ""}
                        </td>
                        <td className="px-3 py-1.5 text-xs">
                          {translatePositionAbbreviation(
                            t,
                            player.natural_position || player.position,
                          )}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-xs font-bold ${condColor(player.condition)}`}
                        >
                          {Math.round(player.condition)}%
                        </td>
                        <td className="px-3 py-1.5">
                          <Select
                            value={pg?.id || ""}
                            onChange={(e) => setPlayerGroup(player.id, e.target.value)}
                            disabled={isSaving}
                            variant="muted"
                            selectSize="xs"
                          >
                            <option value="">{t("training.groups.teamDefault")}</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-3 py-1.5">
                          <Select
                            value={player.training_focus || ""}
                            onChange={(e) => void setPlayerFocus(player.id, e.target.value)}
                            disabled={isSaving}
                            variant={individual ? "highlighted" : "placeholder"}
                            selectSize="xs"
                          >
                            <option value="">{t(`training.focuses.${fallback}.label`)} ↩</option>
                            {trainingFocusIds.map((id) => (
                              <option key={id} value={id}>
                                {t(`training.focuses.${id}.label`)}
                              </option>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
        <p className="mt-3 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
          {t("training.groups.trainingGroupsDesc")}
        </p>
      </CardBody>
    </Card>
  );
}
