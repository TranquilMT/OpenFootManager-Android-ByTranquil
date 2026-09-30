use crate::commands::util::mutate_active_game;
use ofm_core::{board_room::BoardRoom, game::Game, state::StateManager};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn get_board_room(state: State<'_, Arc<StateManager>>) -> Result<BoardRoom, String> {
    state
        .update_game(|game| {
            ofm_core::board_room::initialize(game);
            ofm_core::board_objectives::generate_objectives(game);
            let id = game
                .manager
                .team_id
                .as_deref()
                .ok_or("be.error.noTeamAssigned")?;
            game.board_rooms
                .get(id)
                .cloned()
                .ok_or_else(|| "phase6.unavailable".to_string())
        })
        .unwrap_or_else(|| Err("be.error.noActiveGameSession".to_string()))
}

#[tauri::command]
pub fn negotiate_manager_contract(
    state: State<'_, Arc<StateManager>>,
    salary: u32,
    target: u32,
    years: u32,
) -> Result<Game, String> {
    mutate_active_game(&state, |game| {
        ofm_core::board_room::negotiate(game, salary, target, years)
    })
}

#[tauri::command]
pub fn request_board_investment(
    state: State<'_, Arc<StateManager>>,
    facility: String,
) -> Result<Game, String> {
    let facility = match facility.as_str() {
        "Training" => domain::team::FacilityType::Training,
        "Medical" => domain::team::FacilityType::Medical,
        "Scouting" => domain::team::FacilityType::Scouting,
        _ => return Err("be.error.unknownFacilityType".to_string()),
    };
    mutate_active_game(&state, |game| {
        ofm_core::board_room::request_investment(game, facility)
    })
}
