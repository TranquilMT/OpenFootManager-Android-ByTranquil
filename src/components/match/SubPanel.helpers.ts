import { normalisePosition } from "../squad/SquadTab.helpers";
import type { EnginePlayerData, MatchSnapshot } from "./types";

export type MatchScenarioId = "steady" | "protect-lead" | "find-winner" | "chase-goal";

export type RecommendationReasonId =
  | "low-fitness"
  | "yellow-risk"
  | "fresh-legs"
  | "upgrade"
  | "role-match"
  | "attacking-boost"
  | "defensive-cover";

export interface MatchScenario {
  id: MatchScenarioId;
  recommendedPlayStyle: string;
}

export interface RecommendedSubstitution {
  offId: string;
  onId: string;
  reasons: RecommendationReasonId[];
}

function getTeamState(snapshot: MatchSnapshot, side: "Home" | "Away") {
  return {
    team: side === "Home" ? snapshot.home_team : snapshot.away_team,
    bench: side === "Home" ? snapshot.home_bench : snapshot.away_bench,
    yellows: side === "Home" ? snapshot.home_yellows : snapshot.away_yellows,
  };
}

/** Shared by the bench picker and recommendations; unavailable players never appear as options. */
export function getAvailableMatchBench(snapshot: MatchSnapshot, side: "Home" | "Away") {
  const { team, bench } = getTeamState(snapshot, side);
  const unavailable = new Set([
    ...snapshot.sent_off,
    ...snapshot.events
      .filter(
        (event) =>
          event.side === side &&
          event.event_type === "Injury" &&
          event.player_id &&
          Number.isFinite(event.minute) &&
          event.minute >= 0 &&
          event.minute <= snapshot.current_minute,
      )
      .map((event) => event.player_id as string),
    ...team.players.map((player) => player.id),
    ...snapshot.substitutions
      .filter(
        (sub) =>
          sub.side === side &&
          Number.isFinite(sub.minute) &&
          sub.minute >= 0 &&
          sub.minute <= snapshot.current_minute,
      )
      .flatMap((sub) => [sub.player_off_id, sub.player_on_id]),
  ]);
  const seen = new Set<string>();
  return bench.filter((player) => {
    if (
      !player.id ||
      unavailable.has(player.id) ||
      seen.has(player.id) ||
      !Number.isFinite(player.condition) ||
      player.condition <= 0 ||
      player.condition > 100 ||
      !Number.isFinite(player.ovr) ||
      player.ovr < 0 ||
      player.ovr > 100
    )
      return false;
    seen.add(player.id);
    return true;
  });
}

function getScoreDelta(snapshot: MatchSnapshot, side: "Home" | "Away"): number {
  return side === "Home"
    ? snapshot.home_score - snapshot.away_score
    : snapshot.away_score - snapshot.home_score;
}

function getPositionPriority(position: string, scenario: MatchScenarioId): number {
  const defensiveOrder: Record<string, number> = {
    Goalkeeper: 4,
    Defender: 3,
    Midfielder: 2,
    Forward: 1,
  };
  const attackingOrder: Record<string, number> = {
    Goalkeeper: 1,
    Defender: 2,
    Midfielder: 3,
    Forward: 4,
  };

  if (scenario === "protect-lead") {
    return defensiveOrder[normalisePosition(position)] ?? 0;
  }

  if (scenario === "chase-goal" || scenario === "find-winner") {
    return attackingOrder[normalisePosition(position)] ?? 0;
  }

  return 0;
}

function buildOffPriority(
  player: EnginePlayerData,
  yellowCount: number,
  scenario: MatchScenarioId,
): number {
  return (
    (100 - player.condition) * 2 +
    yellowCount * 18 -
    player.ovr * 0.35 +
    -getPositionPriority(player.position, scenario)
  );
}

function buildBenchPriority(
  candidate: EnginePlayerData,
  offPlayer: EnginePlayerData,
  scenario: MatchScenarioId,
): number {
  const exactRoleBonus =
    candidate.position === offPlayer.position
      ? 24
      : normalisePosition(candidate.position) === normalisePosition(offPlayer.position)
        ? 12
        : 0;
  const fitnessBonus = candidate.condition * 0.9;
  const qualityBonus = candidate.ovr * 0.7;
  const scenarioBonus = getPositionPriority(candidate.position, scenario) * 6;

  const keeperCover =
    offPlayer.position === "Goalkeeper" ? (candidate.handling + candidate.reflexes) * 0.4 : 0;
  return exactRoleBonus + fitnessBonus + qualityBonus + scenarioBonus + keeperCover;
}

export function getMatchScenario(snapshot: MatchSnapshot, side: "Home" | "Away"): MatchScenario {
  const scoreDelta = getScoreDelta(snapshot, side);
  const isLate = snapshot.current_minute >= 70;

  if (scoreDelta > 0 && isLate) {
    return {
      id: "protect-lead",
      recommendedPlayStyle: "Defensive",
    };
  }

  if (scoreDelta < 0 && snapshot.current_minute >= 55) {
    return {
      id: "chase-goal",
      recommendedPlayStyle: "Attacking",
    };
  }

  if (scoreDelta === 0 && isLate) {
    return {
      id: "find-winner",
      recommendedPlayStyle: "HighPress",
    };
  }

  return {
    id: "steady",
    recommendedPlayStyle: "Balanced",
  };
}

export function buildRecommendationReasons(options: {
  benchPlayer: EnginePlayerData;
  offPlayer: EnginePlayerData;
  scenario: MatchScenarioId;
  yellowCount: number;
}): RecommendationReasonId[] {
  const { benchPlayer, offPlayer, scenario, yellowCount } = options;
  const reasons: RecommendationReasonId[] = [];

  if (offPlayer.condition <= 58) {
    reasons.push("low-fitness");
  }

  if (yellowCount > 0) {
    reasons.push("yellow-risk");
  }

  if (benchPlayer.condition - offPlayer.condition >= 15) {
    reasons.push("fresh-legs");
  }

  if (benchPlayer.ovr - offPlayer.ovr >= 3) {
    reasons.push("upgrade");
  }

  if (benchPlayer.position === offPlayer.position) {
    reasons.push("role-match");
  }

  if (
    (scenario === "chase-goal" || scenario === "find-winner") &&
    getPositionPriority(benchPlayer.position, scenario) >
      getPositionPriority(offPlayer.position, scenario)
  ) {
    reasons.push("attacking-boost");
  }

  if (
    scenario === "protect-lead" &&
    getPositionPriority(benchPlayer.position, scenario) >
      getPositionPriority(offPlayer.position, scenario)
  ) {
    reasons.push("defensive-cover");
  }

  return reasons.slice(0, 3);
}

export function buildRecommendedSubstitutions(
  snapshot: MatchSnapshot,
  side: "Home" | "Away",
): RecommendedSubstitution[] {
  const { team, yellows } = getTeamState(snapshot, side);
  const subsMade = side === "Home" ? snapshot.home_subs_made : snapshot.away_subs_made;
  if (
    !Number.isSafeInteger(snapshot.max_subs) ||
    snapshot.max_subs < 0 ||
    !Number.isSafeInteger(subsMade) ||
    subsMade < 0
  )
    return [];
  const remaining = Math.max(0, snapshot.max_subs - subsMade);
  if (snapshot.phase === "Finished" || snapshot.phase === "PenaltyShootout" || remaining === 0)
    return [];
  const scenario = getMatchScenario(snapshot, side);

  const activePlayers = team.players.filter((player) => !snapshot.sent_off.includes(player.id));
  const availableBench = getAvailableMatchBench(snapshot, side);

  if (availableBench.length === 0) {
    return [];
  }

  const injuredIds = new Set(
    snapshot.events
      .filter(
        (event) =>
          event.side === side &&
          event.event_type === "Injury" &&
          Number.isFinite(event.minute) &&
          event.minute >= 0 &&
          event.minute <= snapshot.current_minute,
      )
      .map((event) => event.player_id),
  );
  const usedOffIds = new Set<string>();
  const usedOnIds = new Set<string>();
  const recommendations: Array<RecommendedSubstitution & { score: number }> = [];

  while (
    recommendations.length < Math.min(3, remaining) &&
    usedOffIds.size < activePlayers.length &&
    usedOnIds.size < availableBench.length
  ) {
    const nextRecommendation = activePlayers
      .filter((offPlayer) => !usedOffIds.has(offPlayer.id))
      .map((offPlayer) => {
        const eligibleBench = availableBench.filter(
          (benchPlayer) =>
            !usedOnIds.has(benchPlayer.id) &&
            (offPlayer.position === "Goalkeeper" || benchPlayer.position !== "Goalkeeper"),
        );
        const keeperBench =
          offPlayer.position === "Goalkeeper"
            ? eligibleBench.filter((player) => player.position === "Goalkeeper")
            : [];
        const replacementPool = keeperBench.length > 0 ? keeperBench : eligibleBench;
        const yellowCount = yellows[offPlayer.id] ?? 0;
        const onPlayer = [...replacementPool].sort((leftPlayer, rightPlayer) => {
          return (
            buildBenchPriority(rightPlayer, offPlayer, scenario.id) -
              buildBenchPriority(leftPlayer, offPlayer, scenario.id) ||
            rightPlayer.condition - leftPlayer.condition ||
            rightPlayer.ovr - leftPlayer.ovr ||
            leftPlayer.id.localeCompare(rightPlayer.id)
          );
        })[0];

        if (!onPlayer) {
          return null;
        }

        const reasons = buildRecommendationReasons({
          benchPlayer: onPlayer,
          offPlayer,
          scenario: scenario.id,
          yellowCount,
        });

        if (reasons.length === 0 && !injuredIds.has(offPlayer.id)) {
          return null;
        }

        return {
          offId: offPlayer.id,
          onId: onPlayer.id,
          reasons,
          score:
            (injuredIds.has(offPlayer.id) ? 1000 : 0) +
            buildOffPriority(offPlayer, yellowCount, scenario.id) +
            buildBenchPriority(onPlayer, offPlayer, scenario.id),
        };
      })
      .filter(
        (recommendation): recommendation is RecommendedSubstitution & { score: number } =>
          recommendation != null,
      )
      .sort((leftRecommendation, rightRecommendation) => {
        return (
          rightRecommendation.score - leftRecommendation.score ||
          leftRecommendation.offId.localeCompare(rightRecommendation.offId)
        );
      })[0];

    if (!nextRecommendation) {
      break;
    }

    usedOffIds.add(nextRecommendation.offId);
    usedOnIds.add(nextRecommendation.onId);
    recommendations.push(nextRecommendation);
  }

  return recommendations.map(({ score: _score, ...recommendation }) => recommendation);
}
