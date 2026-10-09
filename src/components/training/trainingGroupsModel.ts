import type { PlayerData } from "../../store/gameStore";
import type { TrainingGroupData } from "../../services/trainingService";

export function buildPlayerGroupMap(groups: TrainingGroupData[]) {
  const playerGroupMap = new Map<string, TrainingGroupData>();

  for (const group of groups) {
    for (const playerId of group.player_ids) {
      playerGroupMap.set(playerId, group);
    }
  }

  return playerGroupMap;
}

export function reassignPlayerTrainingGroup(
  groups: TrainingGroupData[],
  playerId: string,
  groupId: string,
): TrainingGroupData[] {
  if (groupId && !groups.some((group) => group.id === groupId)) {
    return groups;
  }

  let nextGroups = groups.map((group) => ({
    ...group,
    player_ids: group.player_ids.filter((id) => id !== playerId),
  }));

  if (groupId) {
    nextGroups = nextGroups.map((group) =>
      group.id === groupId ? { ...group, player_ids: [...group.player_ids, playerId] } : group,
    );
  }

  return nextGroups;
}

export function sortTrainingRoster(roster: PlayerData[]): PlayerData[] {
  const positionOrder: Record<string, number> = {
    Goalkeeper: 1,
    Defender: 2,
    RightBack: 2, CenterBack: 2, LeftBack: 2, RightWingBack: 2, LeftWingBack: 2,
    Midfielder: 3,
    DefensiveMidfielder: 3, CentralMidfielder: 3, AttackingMidfielder: 3, RightMidfielder: 3, LeftMidfielder: 3,
    Forward: 4,
    RightWinger: 4, LeftWinger: 4, Striker: 4,
  };

  return [...roster].sort((left, right) => {
    const leftOrder = positionOrder[left.natural_position || left.position] || 99;
    const rightOrder = positionOrder[right.natural_position || right.position] || 99;

    return leftOrder - rightOrder || left.match_name.localeCompare(right.match_name) || left.id.localeCompare(right.id);
  });
}
