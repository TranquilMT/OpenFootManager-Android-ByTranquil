import { useTranslation } from "react-i18next";
import type { MatchSnapshot } from "./types";
import { playerMatchPerformance } from "./playerPerformance";
const columns = [
  { key: "minutes", label: "playerProfile.mins" },
  { key: "goals", label: "playerProfile.goals" },
  { key: "assists", label: "playerProfile.assists" },
  { key: "shots", label: "playerProfile.shots" },
  { key: "onTarget", label: "playerProfile.shotsOnTarget" },
  { key: "passes", label: "playerProfile.passes" },
  { key: "tackles", label: "playerProfile.tacklesWon" },
  { key: "saves", label: "phase70.metrics.saves" },
  { key: "yellows", label: "playerProfile.yellows" },
  { key: "reds", label: "playerProfile.reds" },
] as const;
export function PlayerMatchPerformance({
  snapshot,
  playerJerseyMap,
}: {
  snapshot: MatchSnapshot;
  playerJerseyMap?: Map<string, number>;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {(["Home", "Away"] as const).map((side) => {
        const team = side === "Home" ? snapshot.home_team : snapshot.away_team;
        const players = playerMatchPerformance(snapshot, side);
        return (
          <section key={side} className="rounded-xl border border-gray-200 dark:border-navy-600">
            <h3 className="px-3 py-2 font-heading font-bold">{team.name}</h3>
            <div className="touch-x overflow-x-auto">
              <table aria-label={team.name} className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      {t("match.player")}
                    </th>
                    {columns.map((column) => (
                      <th scope="col" key={column.key} className="px-3 py-2 text-right">
                        {t(column.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => {
                    const jersey = playerJerseyMap?.get(player.id);
                    return (
                      <tr key={player.id} className="border-t border-gray-100 dark:border-navy-600">
                        <th scope="row" className="whitespace-nowrap px-3 py-2 font-semibold">
                          {player.name}
                          {jersey != null ? ` (#${jersey})` : ""}
                        </th>
                        {columns.map((column) => (
                          <td key={column.key} className="px-3 py-2 text-right tabular-nums">
                            {player[column.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
