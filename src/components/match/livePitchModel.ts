import { buildPitchSlots } from "./FormationPitch";
import type { EngineTeamData, MatchEvent } from "./types";

/** A tactical shape, not tracking coordinates; preserve the engine XI slot order. */
export function buildLivePitchPlayers(
  team: EngineTeamData,
  side: "Home" | "Away",
  sentOff: string[],
) {
  const slots = buildPitchSlots(team.formation, team.players, sentOff);
  return slots
    .filter((slot) => !sentOff.includes(slot.player.id))
    .map((slot) => ({
      player: slot.player,
      x: side === "Home" ? 4 + (100 - slot.y) * 0.44 : 96 - (100 - slot.y) * 0.44,
      y: side === "Home" ? slot.x : 100 - slot.x,
    }));
}

const BALL_ZONE_POSITIONS = new Map<string, number>([
  ["HomeBox", 8],
  ["HomeDefense", 25],
  ["Midfield", 50],
  ["AwayDefense", 75],
  ["AwayBox", 92],
]);

export function ballZonePosition(zone: string): number | null {
  return BALL_ZONE_POSITIONS.get(zone) ?? null;
}

export function reachedMatchEvents(events: MatchEvent[], minute: number): MatchEvent[] {
  const clock = Number.isFinite(minute) ? Math.max(0, minute) : 0;
  return events
    .filter((event) => Number.isFinite(event.minute) && event.minute >= 0 && event.minute <= clock)
    .sort((a, b) => a.minute - b.minute);
}
