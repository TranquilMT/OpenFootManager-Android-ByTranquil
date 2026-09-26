import { useTranslation } from "react-i18next";
import type { GameStateData } from "../store/gameStore";
import { Badge, TeamLogo } from "./ui";
import { getTeamName,getUserCompetition,getUserNextFixture,formatMatchDate,isSeasonComplete } from "../lib/helpers";

export default function NextMatchDisplay({gameState}:{gameState:GameStateData}){
 const {t}=useTranslation(); const userTeamId=gameState.manager.team_id; const league=getUserCompetition(gameState);
 if(!userTeamId||!league)return <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">{t("home.noLeagueSchedule")}</p>;
 const nextFixture=getUserNextFixture(gameState); if(!nextFixture)return <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">{t(isSeasonComplete(league)?"home.seasonComplete":"home.noUpcomingOpponent")}</p>;
 const isHome=nextFixture.home_team_id===userTeamId; const opponentId=isHome?nextFixture.away_team_id:nextFixture.home_team_id; const userTeam=gameState.teams.find(x=>x.id===userTeamId); const opponentTeam=gameState.teams.find(x=>x.id===opponentId);
 const fixtureLabel=nextFixture.competition==="League"?t("home.matchdayN",{n:nextFixture.matchday}):nextFixture.competition==="PreseasonTournament"?t("season.preseasonTournament"):t("season.friendly");
 const Team=({team,id,primary=false}:{team:typeof userTeam,id:string,primary?:boolean})=><div className="min-w-0 flex-1 text-center">{team&&<TeamLogo team={team} className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 sm:h-16 sm:w-16 ${primary?"border-primary-200 dark:border-primary-800":"border-gray-300 dark:border-navy-600"}`} imageClassName="h-9 w-9 object-contain drop-shadow sm:h-12 sm:w-12" style={{backgroundColor:team.colors.primary}}/>}<p className={`truncate font-heading text-xs font-bold uppercase tracking-wide sm:text-sm ${primary?"text-primary-600 dark:text-primary-400":"text-gray-500 dark:text-gray-400"}`}>{getTeamName(gameState.teams,id)}</p></div>;
 return <div className="rounded-xl border border-gray-100 bg-gray-50 px-2 py-4 transition-colors dark:border-navy-600 dark:bg-navy-800 sm:px-4 sm:py-6"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4"><Team team={userTeam} id={userTeamId} primary/><div className="flex min-w-[5.5rem] flex-col items-center gap-1 text-center"><span className="font-heading text-xl font-bold text-gray-300 dark:text-navy-600 sm:text-2xl">VS</span><Badge variant="neutral">{formatMatchDate(nextFixture.date)}</Badge><span className="max-w-24 text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">{fixtureLabel}</span><Badge variant={isHome?"success":"accent"} size="sm">{isHome?t("home.home"):t("home.away")}</Badge></div><Team team={opponentTeam} id={opponentId}/></div></div>;
}
