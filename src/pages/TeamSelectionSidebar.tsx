import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LeagueData, PlayerData, TeamData } from "../store/gameStore";
import { getPlayerOvr } from "../lib/helpers";
import { competitionDisplayName } from "../lib/competitionName";
import { Badge, Card, CardBody, TeamLocation } from "../components/ui";
import { Globe, Shield, Target, Users } from "lucide-react";
interface Props {
  selectedTeam: TeamData | null;
  selectedTeamXi: PlayerData[];
  selectedTeamCompetitions: LeagueData[];
  getTeamAvgOvr: (teamId: string) => number;
}
export default function TeamSelectionSidebar({
  selectedTeam,
  selectedTeamXi,
  selectedTeamCompetitions,
  getTeamAvgOvr,
}: Props) {
  const { t, i18n } = useTranslation();
  const compName = (c: LeagueData) => competitionDisplayName(c, t);
  return (
    <Card accent="accent" className="h-fit">
      <CardBody className="space-y-4 p-4 sm:space-y-5 sm:p-5">
        {selectedTeam ? (
          <>
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-[.18em] text-gray-500">
                {t("teamSelect.selectedClub")}
              </p>
              <h2 className="mt-1 truncate font-heading text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                {selectedTeam.name}
              </h2>
              <TeamLocation
                city={selectedTeam.city}
                countryCode={selectedTeam.country}
                locale={i18n.language}
                className="mt-1 text-sm text-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Tile
                icon={<Target className="h-4 w-4" />}
                label={t("teamSelect.formation")}
                value={selectedTeam.formation}
              />
              <Tile
                icon={<Shield className="h-4 w-4" />}
                label={t("teamSelect.overall")}
                value={String(getTeamAvgOvr(selectedTeam.id))}
              />
              <Tile
                icon={<Users className="h-4 w-4" />}
                label={t("teamSelect.likelyXi")}
                value={t("teamSelect.playersCount", { count: selectedTeamXi.length })}
              />
              <Tile
                icon={<Globe className="h-4 w-4" />}
                label={t("teamSelect.competitions")}
                value={String(selectedTeamCompetitions.length)}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-heading font-bold uppercase tracking-[.18em] text-gray-500">
                {t("teamSelect.keyPlayers")}
              </p>
              <div className="grid gap-2 sm:grid-cols-1">
                {selectedTeamXi.slice(0, 5).map((player) => (
                  <div
                    key={player.id}
                    className="flex min-h-11 items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-navy-800"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {player.match_name}
                      </p>
                      <p className="text-xs text-gray-500">{player.position}</p>
                    </div>
                    <Badge variant="accent">{getPlayerOvr(player)}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-heading font-bold uppercase tracking-[.18em] text-gray-500">
                {t("teamSelect.activeCompetitions")}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                {selectedTeamCompetitions.map((c) => (
                  <Badge key={c.id} variant="primary">
                    <span className="whitespace-nowrap">{compName(c)}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="py-5 text-center text-sm text-gray-500">
            {t("teamSelect.selectClubPrompt")}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-3 dark:bg-navy-800">
      <p className="flex items-center gap-1 text-xs text-gray-400">
        {icon}
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1 truncate font-heading font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
