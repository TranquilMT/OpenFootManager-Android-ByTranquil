use crate::game::Game;
use chrono::{Datelike, Duration, NaiveDate};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct BoardRoom {
    pub manager_id: String,
    pub joined_season: u32,
    pub contract: Option<ManagerContract>,
    pub ownership_generation: u32,
    pub takeover_due: Option<String>,
    pub last_ownership_review: String,
    pub last_salary_date: String,
    pub last_negotiation_date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct ManagerContract {
    pub weekly_salary: u32,
    pub end_date: String,
    pub league_target: u32,
    pub youth_minutes_target: u32,
    pub style: String,
}

impl Default for ManagerContract {
    fn default() -> Self {
        Self { weekly_salary: 500, end_date: String::new(), league_target: 4,
            youth_minutes_target: 0, style: "Balanced".to_string() }
    }
}

pub fn initialize(game: &mut Game) {
    let Some(id) = game.manager.team_id.clone() else { return; };
    let Some(team) = game.teams.iter().find(|team| team.id == id) else { return; };
    let season = game.league.as_ref().map(|league| league.season).unwrap_or(1);
    let reputation = team.reputation;
    let style = format!("{:?}", team.play_style);
    let date = game.clock.current_date.date_naive();
    let salary = salary_offer(reputation, game.manager.reputation);
    let room = game.board_rooms.entry(id).or_default();
    if room.manager_id != game.manager.id || room.contract.is_none() {
        room.manager_id = game.manager.id.clone();
        room.joined_season = season;
        room.contract = Some(ManagerContract {
            weekly_salary: salary, end_date: (date + Duration::days(730)).to_string(),
            style, ..ManagerContract::default()
        });
        room.last_salary_date = date.to_string();
        room.last_negotiation_date.clear();
    }
}

pub fn salary_offer(club_reputation: u32, manager_reputation: u32) -> u32 {
    (club_reputation.min(1000) * 20 + manager_reputation.min(1000) * 5).max(500)
}

pub fn negotiation_limit(base_salary: u32, confidence: u8, target: u32, base_target: u32) -> u32 {
    let ambition = if target < base_target { 15 } else if target > base_target { -15 } else { 0 };
    let percent = (100_i64 + i64::from(confidence.min(100)) / 5 + ambition).clamp(75, 135);
    (i64::from(base_salary) * percent / 100) as u32
}

pub fn negotiate(game: &mut Game, salary: u32, target: u32, years: u32) -> Result<(), String> {
    let id = game.manager.team_id.clone().ok_or("be.error.noTeamAssigned")?;
    let team = game.teams.iter().find(|team| team.id == id).ok_or("be.error.teamNotFound")?;
    let size = game.league.as_ref().map(|league| league.standings.len() as u32).unwrap_or(1).max(1);
    let objective = game.board_objectives.iter().find(|objective| objective.id == "obj_position")
        .map(|objective| objective.target).unwrap_or(size);
    let base = salary_offer(team.reputation, game.manager.reputation);
    let max_salary = negotiation_limit(base, game.manager.satisfaction, target, objective);
    let date = game.clock.current_date.date_naive();
    let room = game.board_rooms.get(&id).ok_or("phase6.unavailable")?;
    if room.takeover_due.is_some() { return Err("phase6.takeoverPause".to_string()); }
    if room.manager_id != game.manager.id || room.contract.is_none() { return Err("phase6.unavailable".to_string()); }
    if NaiveDate::parse_from_str(&room.last_negotiation_date, "%Y-%m-%d").ok()
        .is_some_and(|last| date.signed_duration_since(last).num_days() < 30) {
        return Err("phase6.negotiationCooldown".to_string());
    }
    if !(1..=3).contains(&years) || target == 0 || target > size || target > objective.saturating_add(2).min(size)
        || salary < 100 || salary > max_salary || i64::from(salary) * 52 > team.wage_budget.max(0) / 5 {
        return Err("phase6.offerRejected".to_string());
    }
    let room = game.board_rooms.get_mut(&id).expect("validated board room");
    let contract = room.contract.as_mut().expect("validated contract");
    contract.weekly_salary = salary;
    contract.end_date = (date + Duration::days(i64::from(years) * 365)).to_string();
    contract.league_target = target;
    room.last_negotiation_date = date.to_string();
    if let Some(objective) = game.board_objectives.iter_mut().find(|objective| objective.id == "obj_position") {
        objective.target = target;
        objective.met = false;
    }
    game.manager.satisfaction = game.manager.satisfaction.saturating_add(2).min(100);
    notify(game, "contract", "phase6.contractAgreed");
    Ok(())
}

fn notify(game: &mut Game, kind: &str, body: &str) {
    use domain::message::{InboxMessage, MessageCategory};
    let today = game.clock.current_date.format("%Y-%m-%d").to_string();
    let id = game.manager.team_id.as_deref().unwrap_or_default();
    let message = InboxMessage::new(format!("board_room_{kind}_{id}_{today}"),
        "phase6.boardRoom".to_string(), body.to_string(), "be.sender.boardOfDirectors".to_string(), today)
        .with_category(MessageCategory::BoardDirective)
        .with_i18n("phase6.boardRoom", body, std::collections::HashMap::new())
        .with_sender_i18n("be.sender.boardOfDirectors", "be.role.chairman");
    crate::inbox::emit(game, message);
}

pub fn process_day(game: &mut Game) {
    initialize(game);
    let Some(id) = game.manager.team_id.clone() else { return; };
    let date = game.clock.current_date.date_naive();
    let Some(room) = game.board_rooms.get(&id).cloned() else { return; };
    if room.takeover_due.as_ref().is_some_and(|due| due.as_str() <= date.to_string().as_str()) {
        complete_takeover(game, &id);
    } else if date.day() == 1 && matches!(date.month(), 1 | 4 | 7 | 10)
        && room.last_ownership_review != date.to_string() {
        game.board_rooms.get_mut(&id).unwrap().last_ownership_review = date.to_string();
        use rand::RngExt;
        if rand::rng().random_range(0..100) < 3 {
            game.board_rooms.get_mut(&id).unwrap().takeover_due = Some((date + Duration::days(30)).to_string());
            notify(game, "ownership", "phase6.takeoverStarted");
        }
    }
    let room = game.board_rooms.get(&id).cloned().unwrap();
    let Some(contract) = room.contract else { return; };
    if contract.end_date.as_str() < date.to_string().as_str() {
        notify(game, "renewal", "phase6.contractRenewal");
        // An expired contract does not silently fire the manager; renewal is negotiable.
        return;
    }
    let elapsed = NaiveDate::parse_from_str(&room.last_salary_date, "%Y-%m-%d").ok()
        .map(|last| date.signed_duration_since(last).num_days()).unwrap_or(0);
    if elapsed >= 7 {
        let weeks = elapsed / 7;
        if crate::finances::post(game, &id, -(i64::from(contract.weekly_salary) * weeks),
            crate::finances::CashKind::StaffWages, date).is_ok() {
            game.board_rooms.get_mut(&id).unwrap().last_salary_date = date.to_string();
        }
    }
}

pub fn complete_takeover(game: &mut Game, team_id: &str) {
    let Some(team) = game.teams.iter().find(|team| team.id == team_id) else { return; };
    let investment = i64::from(team.reputation.min(1000)).saturating_mul(10_000).max(100_000);
    let date = game.clock.current_date.date_naive();
    if crate::finances::post(game, team_id, investment, crate::finances::CashKind::BoardSupport, date).is_err() { return; }
    let room = game.board_rooms.entry(team_id.to_string()).or_default();
    room.ownership_generation = room.ownership_generation.saturating_add(1);
    room.takeover_due = None;
    if let Some(team) = game.teams.iter_mut().find(|team| team.id == team_id) {
        team.transfer_budget = team.transfer_budget.saturating_add(investment / 2);
    }
    game.manager.satisfaction = game.manager.satisfaction.max(50);
    notify(game, "takeover", "phase6.takeoverCompleted");
}
