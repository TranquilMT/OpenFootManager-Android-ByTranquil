import { invoke } from "@tauri-apps/api/core";
import type { MatchSnapshot } from "../components/match/types";
export function setShootoutOrder(
  side: "Home" | "Away",
  playerIds: string[],
): Promise<MatchSnapshot> {
  return invoke<MatchSnapshot>("apply_match_command", {
    command: { SetPenaltyOrder: { side, player_ids: playerIds } },
  });
}
