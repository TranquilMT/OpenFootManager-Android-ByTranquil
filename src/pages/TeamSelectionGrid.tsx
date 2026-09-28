import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TeamData } from "../store/gameStore";
import { formatVal } from "../lib/helpers";
import { Badge, Card, CardBody, TeamLocation, TeamLogo } from "../components/ui";
import { Landmark, Search, Star, Trophy, Users } from "lucide-react";
interface TeamGroup {
  id: string;
  name: string;
  order: number;
  teams: TeamData[];
}
interface TeamSelectionGridProps {
  clubSearch: string;
  onClubSearchChange: (value: string) => void;
  filteredTeamsCount: number;
  teamGroups: TeamGroup[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  getTeamAvgOvr: (teamId: string) => number;
  getTeamPlayerCount: (teamId: string) => number;
}
export default function TeamSelectionGrid({
  clubSearch,
  onClubSearchChange,
  filteredTeamsCount,
  teamGroups,
  selectedTeamId,
  onSelectTeam,
  getTeamAvgOvr,
  getTeamPlayerCount,
}: TeamSelectionGridProps) {
  const { t, i18n } = useTranslation();
  const getRep = (rep: number) =>
    rep >= 750
      ? { label: t("teamSelect.repWorldClass"), variant: "accent" as const }
      : rep >= 600
        ? { label: t("teamSelect.repStrong"), variant: "success" as const }
        : rep >= 400
          ? { label: t("teamSelect.repAverage"), variant: "neutral" as const }
          : { label: t("teamSelect.repDeveloping"), variant: "danger" as const };
  return (
    <div>
      <div className="sticky top-[62px] z-20 mb-3 rounded-xl bg-gray-100/95 py-2 backdrop-blur dark:bg-navy-900/95 sm:static sm:bg-transparent sm:py-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={clubSearch}
            onChange={(e) => onClubSearchChange(e.target.value)}
            placeholder={t("teamSelect.searchClubs")}
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-20 text-base text-gray-700 placeholder:text-gray-400 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-200 sm:text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-heading font-bold text-gray-500">
            {filteredTeamsCount}
          </span>
        </div>
      </div>
      {filteredTeamsCount === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">{t("teamSelect.noClubsMatch")}</p>
      ) : (
        <div className="space-y-5 sm:max-h-[640px] sm:overflow-y-auto sm:pr-1">
          {teamGroups.map((group) => (
            <section key={group.id}>
              <p className="mb-2 text-xs font-heading font-bold uppercase tracking-[.18em] text-gray-500">
                {group.name}
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.teams.map((team) => {
                  const selected = selectedTeamId === team.id,
                    rep = getRep(team.reputation);
                  return (
                    <button
                      key={team.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelectTeam(team.id)}
                      className={`rounded-xl text-left transition active:scale-[.99] ${selected ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-navy-900" : ""}`}
                    >
                      <Card accent={selected ? "primary" : "none"} className="h-full">
                        <div
                          className={`rounded-t-xl p-3 sm:p-4 ${selected ? "bg-gradient-to-r from-primary-600 to-primary-700" : "bg-gradient-to-r from-navy-700 to-navy-800"}`}
                        >
                          <div className="flex items-center gap-3">
                            <TeamLogo
                              team={team}
                              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10"
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-heading text-base font-bold text-white">
                                {team.name}
                              </h3>
                              <TeamLocation
                                city={team.city}
                                countryCode={team.country}
                                locale={i18n.language}
                                className="mt-0.5 text-xs text-gray-300"
                                iconClassName="h-3 w-3"
                                flagClassName="text-xs"
                              />
                            </div>
                            {selected && (
                              <Star className="h-5 w-5 shrink-0 fill-current text-accent-400" />
                            )}
                          </div>
                        </div>
                        <CardBody className="p-3 sm:p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <InfoStat
                              icon={<Trophy className="h-3.5 w-3.5" />}
                              label={t("teamSelect.reputation")}
                              value={
                                <Badge variant={rep.variant} size="sm">
                                  {rep.label}
                                </Badge>
                              }
                            />
                            <InfoStat
                              icon={<Users className="h-3.5 w-3.5" />}
                              label={t("teamSelect.squad")}
                              value={<b>{getTeamPlayerCount(team.id)}</b>}
                            />
                            <InfoStat
                              icon={<Landmark className="h-3.5 w-3.5" />}
                              label={t("teamSelect.finances")}
                              value={<b>{formatVal(team.finance)}</b>}
                            />
                            <InfoStat
                              icon={<Star className="h-3.5 w-3.5" />}
                              label={t("teamSelect.avgOvr")}
                              value={
                                <b className="text-lg text-primary-500">{getTeamAvgOvr(team.id)}</b>
                              }
                            />
                          </div>
                        </CardBody>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
function InfoStat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1 text-xs text-gray-400">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="truncate font-heading text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}
