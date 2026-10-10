import type {MatchSnapshot} from "./types";
import {matchMetrics} from "./narrativeContext";

export function playerMatchPerformance(snapshot: MatchSnapshot, side: "Home" | "Away") {
 const team = side === "Home" ? snapshot.home_team : snapshot.away_team;
 const bench = side === "Home" ? snapshot.home_bench : snapshot.away_bench;
 const used = new Set(snapshot.substitutions.filter(sub=>sub.side===side).flatMap(sub=>[sub.player_on_id,sub.player_off_id]));
 const active = new Set(team.players.map(player=>player.id));
 const seen = new Set<string>();
 return [...team.players,...bench].filter(player=>{
  if(!player.id || seen.has(player.id) || (!active.has(player.id) && !used.has(player.id))) return false;
  seen.add(player.id);return true;
 }).map(player=>{
  const own = snapshot.events.filter(event=>event.side===side && event.player_id===player.id);
  const metrics = matchMetrics(own,side);
  return {id:player.id,name:player.name,goals:own.filter(event=>["Goal","PenaltyGoal"].includes(event.event_type)).length,
   assists:snapshot.events.filter(event=>event.side===side && event.event_type==="Goal" && event.secondary_player_id===player.id && event.player_id!==player.id).length,
   shots:metrics.shots,onTarget:metrics.onTarget,
   passes:own.filter(event=>event.event_type==="PassCompleted").length,
   tackles:own.filter(event=>event.event_type==="TackleWon").length,
   saves:snapshot.events.filter(event=>event.side!==side && event.event_type==="ShotSaved" && event.shot?.goalkeeper_id===player.id).length,
   yellows:own.filter(event=>["YellowCard","SecondYellow"].includes(event.event_type)).length,
   reds:own.filter(event=>["RedCard","SecondYellow"].includes(event.event_type)).length,
  };
 });
}
