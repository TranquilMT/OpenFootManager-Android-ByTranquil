import type { MatchEvent } from "./types";
/** Roles remain in the source event: a secondary actor is not automatically an assist. */
export function highlightParticipants(event: MatchEvent): string[] {
  return [
    ...new Set(
      [event.player_id, event.secondary_player_id, event.shot?.goalkeeper_id].filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      ),
    ),
  ];
}
