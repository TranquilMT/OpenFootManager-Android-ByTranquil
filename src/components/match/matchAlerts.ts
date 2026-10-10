import type { MatchEvent, MatchSnapshot } from "./types";
export interface MatchAlert {
  event: MatchEvent;
  action: "substitution" | "tactics";
  priority: number;
}
export function matchAlerts(snapshot: MatchSnapshot, side: "Home" | "Away"): MatchAlert[] {
  if (["Finished", "PenaltyShootout"].includes(snapshot.phase)) return [];
  const team = side === "Home" ? snapshot.home_team : snapshot.away_team;
  const subsMade = side === "Home" ? snapshot.home_subs_made : snapshot.away_subs_made;
  const canSubstitute =
    Number.isSafeInteger(snapshot.max_subs) &&
    Number.isSafeInteger(subsMade) &&
    subsMade >= 0 &&
    subsMade < snapshot.max_subs;
  const playerAction: MatchAlert["action"] = canSubstitute ? "substitution" : "tactics";
  const active = new Set(team.players.map((player) => player.id));
  const events = snapshot.events.filter(
    (event) =>
      event.side === side &&
      event.player_id &&
      Number.isFinite(event.minute) &&
      event.minute >= 0 &&
      event.minute <= snapshot.current_minute,
  );
  const dismissals: MatchAlert[] = events
    .filter(
      (event) =>
        ["RedCard", "SecondYellow"].includes(event.event_type) &&
        !snapshot.events.some(
          (response, index) =>
            response.side === side &&
            response.event_type === "TacticalChange" &&
            Number.isFinite(response.minute) &&
            response.minute >= 0 &&
            response.minute <= snapshot.current_minute &&
            (response.minute > event.minute ||
              (response.minute === event.minute && index > snapshot.events.indexOf(event))),
        ),
    )
    .map((event) => ({ event, action: "tactics", priority: 3 }));
  const injuries: MatchAlert[] = events
    .filter(
      (event) =>
        event.event_type === "Injury" &&
        active.has(event.player_id ?? "") &&
        !snapshot.sent_off.includes(event.player_id ?? ""),
    )
    .map((event) => ({ event, action: playerAction, priority: 2 }));
  const bookings: MatchAlert[] = events
    .filter(
      (event) =>
        event.event_type === "YellowCard" &&
        active.has(event.player_id ?? "") &&
        !snapshot.sent_off.includes(event.player_id ?? ""),
    )
    .map((event) => ({ event, action: playerAction, priority: 1 }));
  const seen = new Set<string>();
  return [...dismissals, ...injuries, ...bookings]
    .sort((a, b) => b.priority - a.priority || b.event.minute - a.event.minute)
    .filter((alert) => {
      const id = alert.event.player_id ?? "";
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, 3);
}
