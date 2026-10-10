import type { MatchSnapshot } from "./types";
import { matchMetrics } from "./narrativeContext";

export function playerMatchPerformance(snapshot: MatchSnapshot, side: "Home" | "Away") {
  const events = snapshot.events.filter(
    (event) =>
      Number.isFinite(event.minute) && event.minute >= 0 && event.minute <= snapshot.current_minute,
  );
  const team = side === "Home" ? snapshot.home_team : snapshot.away_team;
  const bench = side === "Home" ? snapshot.home_bench : snapshot.away_bench;
  const substitutions = snapshot.substitutions
    .filter(
      (sub) =>
        sub.side === side &&
        Number.isFinite(sub.minute) &&
        sub.minute >= 0 &&
        sub.minute <= snapshot.current_minute,
    )
    .sort((a, b) => a.minute - b.minute);
  const used = new Set(substitutions.flatMap((sub) => [sub.player_on_id, sub.player_off_id]));
  for (const event of events) {
    if (
      event.side === side &&
      event.player_id &&
      ["RedCard", "SecondYellow"].includes(event.event_type)
    )
      used.add(event.player_id);
  }
  const active = new Set(team.players.map((player) => player.id));
  const seen = new Set<string>();
  return [...team.players, ...bench]
    .filter((player) => {
      if (!player.id || seen.has(player.id) || (!active.has(player.id) && !used.has(player.id)))
        return false;
      seen.add(player.id);
      return true;
    })
    .map((player) => {
      const own = events.filter((event) => event.side === side && event.player_id === player.id);
      const metrics = matchMetrics(own, side);
      const entered = substitutions.find((sub) => sub.player_on_id === player.id)?.minute ?? 0;
      const left = substitutions.find((sub) => sub.player_off_id === player.id)?.minute;
      const dismissed = own.reduce(
        (earliest, event) =>
          ["RedCard", "SecondYellow"].includes(event.event_type)
            ? Math.min(earliest, event.minute)
            : earliest,
        Infinity,
      );
      const firstKick = events.find((event) =>
        ["ShootoutGoal", "ShootoutMiss"].includes(event.event_type),
      )?.minute;
      const playedClock =
        firstKick == null ? snapshot.current_minute : Math.min(snapshot.current_minute, firstKick);
      const end = Math.min(playedClock, left ?? Infinity, dismissed ?? Infinity);
      const minutes = Math.max(0, end - entered);
      return {
        id: player.id,
        name: player.name,
        minutes,
        goals: own.filter((event) => ["Goal", "PenaltyGoal"].includes(event.event_type)).length,
        assists: events.filter(
          (event) =>
            event.side === side &&
            event.event_type === "Goal" &&
            Boolean(event.player_id) &&
            event.secondary_player_id === player.id &&
            event.player_id !== player.id,
        ).length,
        shots: metrics.shots,
        onTarget: metrics.onTarget,
        passes: own.filter((event) => event.event_type === "PassCompleted").length,
        tackles: own.filter((event) => event.event_type === "TackleWon").length,
        saves: events.filter(
          (event) =>
            event.side !== side &&
            event.event_type === "ShotSaved" &&
            (event.shot?.goalkeeper_id || event.secondary_player_id) === player.id,
        ).length,
        yellows: own.filter((event) => ["YellowCard", "SecondYellow"].includes(event.event_type))
          .length,
        reds: own.filter((event) => ["RedCard", "SecondYellow"].includes(event.event_type)).length,
      };
    });
}
