import { invoke } from "@tauri-apps/api/core";
import type { GameStateData } from "../store/gameStore";

export interface BoardRoomData {
  manager_id: string;
  joined_season: number;
  baseline_target: number;
  style_matches: number;
  ownership_generation: number;
  takeover_due: string | null;
  last_negotiation_date: string;
  last_investment_season: number;
  contract: {
    weekly_salary: number;
    end_date: string;
    league_target: number;
    youth_minutes_target: number;
    style: string;
  } | null;
}
export const getBoardRoom = () => invoke<BoardRoomData>("get_board_room");
export const negotiateManagerContract = (salary: number, target: number, years: number) =>
  invoke<GameStateData>("negotiate_manager_contract", { salary, target, years });
export const requestBoardInvestment = (facility: string) =>
  invoke<GameStateData>("request_board_investment", { facility });
