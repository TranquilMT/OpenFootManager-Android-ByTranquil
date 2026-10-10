import type { MatchSnapshot } from "./types";
import { playerMatchPerformance } from "./playerPerformance";

/** Existing report-rating weights, applied to all recorded participants. */
export function playerMatchRatings(snapshot: MatchSnapshot, side: "Home" | "Away") {
  const team = side === "Home" ? snapshot.home_team : snapshot.away_team;
  const bench = side === "Home" ? snapshot.home_bench : snapshot.away_bench;
  const rows = playerMatchPerformance(snapshot, side);
  const participants = rows.flatMap((row) => {
    const player = [...team.players, ...bench].find((player) => player.id === row.id);
    return player ? [player] : [];
  });
  const ratings: Record<string, number> = {};
  participants.forEach((p) => {
    ratings[p.id] = 6.0;
  });
  snapshot.events.forEach((evt) => {
    if (evt.side !== side || !evt.player_id) return;
    if (!ratings[evt.player_id] && ratings[evt.player_id] !== 0) return;
    if (evt.event_type === "Goal" || evt.event_type === "PenaltyGoal")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) + 1.2;
    else if (evt.event_type === "ShotSaved" || evt.event_type === "ShotOnTarget")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) + 0.2;
    else if (evt.event_type === "ShotOffTarget")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) - 0.1;
    else if (evt.event_type === "PassCompleted")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) + 0.02;
    else if (evt.event_type === "Tackle" || evt.event_type === "Interception")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) + 0.15;
    else if (evt.event_type === "Foul")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) - 0.2;
    else if (evt.event_type === "YellowCard" || evt.event_type === "SecondYellow")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) - 0.5;
    else if (evt.event_type === "RedCard")
      ratings[evt.player_id] = (ratings[evt.player_id] || 6) - 1.5;
    if (
      evt.secondary_player_id &&
      evt.secondary_player_id !== evt.player_id &&
      ratings[evt.secondary_player_id] !== undefined
    ) {
      if (evt.event_type === "Goal" || evt.event_type === "PenaltyGoal")
        ratings[evt.secondary_player_id] += 0.7;
    }
  });
  const won =
    (side === "Home" && snapshot.home_score > snapshot.away_score) ||
    (side === "Away" && snapshot.away_score > snapshot.home_score);
  if (won)
    Object.keys(ratings).forEach((id) => {
      ratings[id] += 0.5;
    });
  Object.keys(ratings).forEach((id) => {
    ratings[id] = Math.max(1, Math.min(10, ratings[id]));
  });
  const sorted = participants
    .map((p) => ({ ...p, rating: Math.round(ratings[p.id] * 10) / 10 }))
    .sort((a, b) => b.rating - a.rating);
  return sorted;
}
