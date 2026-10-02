import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PlayerData } from "../../store/types";
import { formatExactMoney, getPlayerOvr } from "../../lib/helpers";
import { annualAmountToWeeklyCommitment } from "../../lib/finance";
import { Card, CardHeader, CardBody, Select } from "../ui";
import {
  getBestRoleForFormation,
  getSquadTacticalFit,
  translatePositionAbbreviation,
} from "../squad/SquadTab.helpers";

export default function ShortlistComparison({
  players,
  formation,
}: {
  players: PlayerData[];
  formation: string;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<[string, string]>(["", ""]);
  const first = players.find((player) => player.id === selected[0]) ?? players[0];
  const second =
    players.find((player) => player.id === selected[1] && player.id !== first?.id) ??
    players.find((player) => player.id !== first?.id);
  const pair = [first, second];
  const fit = (player: PlayerData) => {
    const role = getBestRoleForFormation(player, formation);
    const kind = getSquadTacticalFit(player, role);
    return `${translatePositionAbbreviation(t, role)} · ${t(kind === "natural" ? "squad.naturalFit" : kind === "adapted" ? "squad.adaptedFit" : "squad.outOfPosition")}`;
  };
  const rows = [
    {
      key: "common.position",
      value: (player: PlayerData) =>
        translatePositionAbbreviation(t, player.natural_position || player.position),
    },
    { key: "youthAcademy.ovr", value: (player: PlayerData) => getPlayerOvr(player) },
    {
      key: "youthAcademy.potential",
      value: (player: PlayerData) => player.potential ?? t("common.unknown"),
    },
    {
      key: "playerProfile.weeklyWage",
      value: (player: PlayerData) => formatExactMoney(annualAmountToWeeklyCommitment(player.wage)),
    },
    { key: "squad.formationFit", value: fit },
  ];
  return (
    <Card>
      <CardHeader>{t("scouting.compareShortlist")}</CardHeader>
      <CardBody>
        {!first || !second ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">{t("scouting.compareHint")}</p>
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {pair.map((player, index) => (
                <Select
                  key={index}
                  aria-label={t("scouting.comparisonPlayer", { number: index + 1 })}
                  value={player?.id ?? ""}
                  onChange={(event) =>
                    setSelected(
                      index === 0
                        ? [event.target.value, second.id]
                        : [first.id, event.target.value],
                    )
                  }
                >
                  {players.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      disabled={option.id === pair[1 - index]?.id}
                    >
                      {option.full_name}
                    </option>
                  ))}
                </Select>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{t("scouting.compareShortlist")}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="p-2 text-left">
                      {t("scouting.player")}
                    </th>
                    {pair.map((player) => (
                      <th scope="col" key={player?.id} className="p-2 text-left">
                        {player?.full_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-t border-gray-200 dark:border-navy-600">
                      <th scope="row" className="p-2 text-left font-medium">
                        {t(row.key)}
                      </th>
                      {pair.map((player) => (
                        <td key={player?.id} className="p-2">
                          {player ? row.value(player) : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
