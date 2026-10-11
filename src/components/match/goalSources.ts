import type { MatchEvent } from "./types";
const SET_PIECE_CLEAR_EVENTS = new Set([
  "ShotOffTarget",
  "ShotBlocked",
  "ShotSaved",
  "PenaltyMiss",
  "Clearance",
  "Interception",
  "PassIntercepted",
  "GoalKick",
]);

export function computeGoalSources(
  events: MatchEvent[],
  side: "Home" | "Away",
): { openPlay: number; corners: number; freekicks: number; penalties: number } {
  const sources = { openPlay: 0, corners: 0, freekicks: 0, penalties: 0 };
  // Track (type, side) so a set piece by one team doesn't attribute the other's goal
  let lastSetPiece: { type: "Corner" | "FreeKick"; side: "Home" | "Away" } | null = null;
  for (const evt of events) {
    if (evt.event_type === "Corner") {
      lastSetPiece = { type: "Corner", side: evt.side };
    } else if (evt.event_type === "FreeKick") {
      lastSetPiece = null;
      // Only dangerous FKs: taking side must be in their attacking third
      const dangerousZone = evt.side === "Home" ? "AwayDefense" : "HomeDefense";
      if (evt.zone === dangerousZone) {
        lastSetPiece = { type: "FreeKick", side: evt.side };
      }
    } else if (SET_PIECE_CLEAR_EVENTS.has(evt.event_type)) {
      lastSetPiece = null;
    } else if (evt.event_type === "Goal") {
      if (evt.side === side) {
        if (lastSetPiece?.type === "Corner" && lastSetPiece.side === side) sources.corners++;
        else if (lastSetPiece?.type === "FreeKick" && lastSetPiece.side === side)
          sources.freekicks++;
        else sources.openPlay++;
      }
      lastSetPiece = null;
    } else if (evt.event_type === "PenaltyGoal") {
      if (evt.side === side) sources.penalties++;
      lastSetPiece = null;
    }
  }
  return sources;
}
