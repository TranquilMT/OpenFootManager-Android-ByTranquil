import type { MatchEvent, MatchSnapshot } from "./types";
export interface MatchAlert { event: MatchEvent; action: "substitution" | "tactics"; priority: number }
export function matchAlerts(snapshot: MatchSnapshot, side: "Home" | "Away"): MatchAlert[] {
  if (["Finished", "PenaltyShootout"].includes(snapshot.phase)) return [];
  const team=side === "Home" ? snapshot.home_team : snapshot.away_team;
  const active=new Set(team.players.map(player=>player.id));
  const events=snapshot.events.filter(event=>event.side === side && event.player_id &&
    Number.isFinite(event.minute) && event.minute>=0 && event.minute<=snapshot.current_minute);
  const latestTactics = Math.max(-1, ...snapshot.events.filter(event => event.side === side && event.event_type === "TacticalChange" && event.minute <= snapshot.current_minute).map(event => event.minute));
  const dismissals: MatchAlert[] = events.filter(event => ["RedCard", "SecondYellow"].includes(event.event_type) && event.minute >= latestTactics).map(event => ({event, action:"tactics", priority:3}));
  const injuries: MatchAlert[] = events.filter(event=>event.event_type === "Injury" && active.has(event.player_id ?? "") &&
    !snapshot.sent_off.includes(event.player_id ?? ""))
    .map(event=>({event,action:"substitution" as const,priority:2}));
  return [...dismissals, ...injuries].sort((a,b) => b.priority-a.priority || b.event.minute-a.event.minute);
}
