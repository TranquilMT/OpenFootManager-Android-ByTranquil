import type { PlayerData } from "../store/gameStore";
import type { PlayerSquadRole } from "../store/types";
import { calcAge } from "./helpers";
import { calcAgeOnDate } from "./valueFormatting";

export function getPlayerSquadRole(player: Pick<PlayerData, "squad_role">): PlayerSquadRole {
  return player.squad_role === "Youth" ? "Youth" : "Senior";
}

export function isYouthAcademyPlayer(player: Pick<PlayerData, "squad_role">): boolean {
  return getPlayerSquadRole(player) === "Youth";
}

export function isSeniorSquadPlayer(player: Pick<PlayerData, "squad_role">): boolean {
  return getPlayerSquadRole(player) === "Senior";
}

export function canDelegateToYouthAcademy(
  player: Pick<PlayerData, "date_of_birth" | "squad_role"> & Partial<Pick<PlayerData, "retired">>,
  asOfDate?: string,
): boolean {
  return (
    !player.retired && isSeniorSquadPlayer(player) &&
    (asOfDate ? calcAgeOnDate(player.date_of_birth, asOfDate) : calcAge(player.date_of_birth)) <= 21
  );
}
