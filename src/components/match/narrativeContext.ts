import type { MatchEvent } from "./types";

const GOALS = new Set(["Goal", "PenaltyGoal"]);
const SHOTS = new Set([
  "Goal",
  "PenaltyGoal",
  "PenaltyMiss",
  "ShotSaved",
  "ShotOnTarget",
  "ShotOffTarget",
  "ShotBlocked",
]);

/** Event order, rather than minute alone, keeps same-minute goals truthful. */
export function eventContext(evt: MatchEvent, events: MatchEvent[]) {
  let index = events.indexOf(evt);
  if (index < 0)
    index = events.findIndex(
      (e) =>
        e.minute === evt.minute &&
        e.event_type === evt.event_type &&
        e.side === evt.side &&
        e.player_id === evt.player_id &&
        e.secondary_player_id === evt.secondary_player_id &&
        JSON.stringify(e.detail) === JSON.stringify(evt.detail) &&
        JSON.stringify(e.shot) === JSON.stringify(evt.shot),
    );
  const prefix =
    index >= 0 ? events.slice(0, index + 1) : [...events.filter((e) => e.minute < evt.minute), evt];
  const before = prefix.slice(0, -1);
  let ownBefore = 0;
  let opponentBefore = 0;
  let trailed = false;
  for (const e of before) {
    if (!GOALS.has(e.event_type)) continue;
    if (e.side === evt.side) ownBefore++;
    else opponentBefore++;
    if (ownBefore < opponentBefore) trailed = true;
  }
  return {
    ownBefore,
    opponentBefore,
    trailed,
    ownAfter: ownBefore + (GOALS.has(evt.event_type) ? 1 : 0),
    playerGoals: prefix.filter(
      (e) => GOALS.has(e.event_type) && e.player_id === evt.player_id && e.side === evt.side,
    ).length,
    recentShots: before.filter(
      (e) =>
        e.side === evt.side &&
        SHOTS.has(e.event_type) &&
        e.minute >= evt.minute - 5 &&
        e.minute <= evt.minute,
    ).length,
    injuryChange:
      Boolean(evt.secondary_player_id) &&
      before.some(
        (e) =>
          e.event_type === "Injury" &&
          e.side === evt.side &&
          e.player_id === evt.secondary_player_id &&
          e.minute >= evt.minute - 10 &&
          e.minute <= evt.minute,
      ),
  };
}

export function narrativeKey(evt: MatchEvent, events: MatchEvent[]): string | null {
  const c = eventContext(evt, events);
  if (GOALS.has(evt.event_type)) {
    if (evt.player_id && c.playerGoals === 4) return "fourGoals";
    if (c.ownAfter === c.opponentBefore && evt.minute >= 80) return "lateEqualiser";
    if (c.ownBefore === c.opponentBefore && c.trailed) return "comebackLead";
    if (c.ownBefore === c.opponentBefore && evt.minute >= 85) return "lateLead";
    if (c.ownBefore === c.opponentBefore && c.ownBefore > 0) return "goAhead";
    if (c.ownAfter < c.opponentBefore) return "stillBehind";
    if (c.ownAfter - c.opponentBefore >= 3) return "commandingLead";
    return null;
  }
  if (evt.detail === "Woodwork") return "woodwork";
  if (evt.detail === "DefensiveError") return "defensiveError";
  if (evt.event_type === "TacticalChange") return "tacticalChange";
  if (evt.event_type === "YellowCard") return "bookingRisk";
  if (evt.event_type === "RedCard" || evt.event_type === "SecondYellow")
    return "numericalDisadvantage";
  if (evt.event_type === "Injury") return "injuryConcern";
  if (evt.event_type === "Substitution") {
    if (c.injuryChange) return "injuryChange";
    if (evt.minute >= 80 && c.ownBefore > c.opponentBefore) return "protectLead";
    if (evt.minute >= 70 && c.ownBefore < c.opponentBefore) return "chaseGame";
    return "freshLegs";
  }
  if (["Corner", "FreeKick", "ShotSaved", "ShotBlocked"].includes(evt.event_type)) {
    if (c.recentShots >= 2) return "sustainedPressure";
    if (evt.minute >= 80 && c.ownBefore < c.opponentBefore) return "latePressure";
  }
  return null;
}

/** Observational metrics: no momentum bonuses or invented shot locations. */
export function matchMetrics(events: MatchEvent[], side: "Home" | "Away") {
  const own = events.filter((e) => e.side === side);
  const shots = own.filter((e) => SHOTS.has(e.event_type));
  const recorded = shots.filter((e) => e.shot && Number.isFinite(e.shot.expected_goals));
  return {
    shots: shots.length,
    onTarget: own.filter((e) =>
      ["Goal", "PenaltyGoal", "ShotSaved", "ShotOnTarget"].includes(e.event_type),
    ).length,
    xg: recorded.reduce((sum, e) => sum + Math.max(0, Math.min(1, e.shot?.expected_goals ?? 0)), 0),
    hasXg: recorded.length > 0,
    woodwork: own.filter((e) => e.detail === "Woodwork").length,
    saves: events.filter((e) => e.side !== side && e.event_type === "ShotSaved").length,
  };
}
