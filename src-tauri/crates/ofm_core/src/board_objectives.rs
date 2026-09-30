use crate::end_of_season;
use crate::finances;
use crate::game::{BoardObjective, Game, ObjectiveType};
use domain::league::FixtureStatus;
use domain::message::*;
use std::collections::HashMap;

struct ObjectiveTargets {
    expected_pos: u32,
    win_target: u32,
    goals_target: u32,
    finance_target: u32,
}

impl ObjectiveTargets {
    fn new(reputation: u32, num_teams: u32) -> Self {
        const HIGH_REPUTATION: u32 = 800;
        const MEDIUM_REPUTATION: u32 = 650;
        const LOW_REPUTATION: u32 = 400;

        // Degenerate worlds can reach this with a single team (the league
        // participant count is only used when > 1, but the fallback is the raw
        // team count) — clamp the position into the table and drop the win/goal
        // floors when there are no matchdays, or the objectives are impossible.
        let league_size = num_teams.max(1);
        let expected_pos = if reputation >= HIGH_REPUTATION {
            1
        } else if reputation >= MEDIUM_REPUTATION {
            (league_size / 4).max(2)
        } else if reputation >= LOW_REPUTATION {
            (league_size / 2).max(1)
        } else {
            (league_size * 3 / 4).max(league_size / 2 + 1)
        }
        .min(league_size);

        let total_matchdays = if league_size > 1 {
            (league_size - 1) * 2
        } else {
            0
        };

        let win_target = if total_matchdays == 0 {
            0
        } else if reputation >= HIGH_REPUTATION {
            (total_matchdays * 60 / 100).max(1)
        } else if reputation >= MEDIUM_REPUTATION {
            (total_matchdays * 45 / 100).max(1)
        } else if reputation >= LOW_REPUTATION {
            (total_matchdays * 30 / 100).max(1)
        } else {
            (total_matchdays * 10 / 100).max(1)
        };

        let goals_target = if total_matchdays == 0 {
            0
        } else if reputation >= HIGH_REPUTATION {
            (total_matchdays * 3 / 2).max(1)
        } else if reputation >= MEDIUM_REPUTATION {
            (total_matchdays / 2).max(15.min(total_matchdays))
        } else {
            (total_matchdays / 5).max(10.min(total_matchdays))
        };

        Self {
            expected_pos,
            win_target,
            goals_target,
            finance_target: 100,
        }
    }
}

fn board_message_id(season: u32) -> String {
    format!("board_objectives_{}", season)
}

fn build_objectives_message(
    targets: &ObjectiveTargets,
    season: u32,
    today: String,
) -> InboxMessage {
    let mut params = HashMap::new();
    params.insert("season".to_string(), season.to_string());
    params.insert("expectedPos".to_string(), targets.expected_pos.to_string());
    params.insert("winTarget".to_string(), targets.win_target.to_string());
    params.insert("goalsTarget".to_string(), targets.goals_target.to_string());
    params.insert(
        "financeTarget".to_string(),
        targets.finance_target.to_string(),
    );

    InboxMessage::new(
        board_message_id(season),
        "be.msg.boardObjectives.subject".to_string(),
        "be.msg.boardObjectives.body".to_string(),
        "be.sender.boardOfDirectors".to_string(),
        today,
    )
    .with_category(MessageCategory::BoardDirective)
    .with_priority(MessagePriority::High)
    .with_sender_role("Chairman")
    .with_i18n(
        "be.msg.boardObjectives.subject",
        "be.msg.boardObjectives.body",
        params,
    )
    .with_sender_i18n("be.sender.boardOfDirectors", "be.role.chairman")
}

fn satisfaction_delta(met_count: usize, total: usize) -> i8 {
    if met_count == total {
        15
    } else if met_count * 2 > total {
        5
    } else if met_count > 0 {
        -5
    } else {
        -15
    }
}

/// Generate board objectives for the current season.
/// Called at season start or when no objectives exist.
pub fn generate_objectives(game: &mut Game) {
    if !game.board_objectives.is_empty() {
        return;
    }

    let user_team_id = match &game.manager.team_id {
        Some(id) => id.clone(),
        None => return,
    };

    let team = match game.teams.iter().find(|t| t.id == user_team_id) {
        Some(t) => t,
        None => return,
    };

    // Scale targets by the user's *league* size, not the whole world — otherwise
    // a 440-club world yields absurd objectives ("win 526 matches" a season).
    let num_teams = game
        .league
        .as_ref()
        .map(|league| {
            if league.participant_ids.is_empty() {
                league.standings.len()
            } else {
                league.participant_ids.len()
            }
        })
        .filter(|&count| count > 1)
        .unwrap_or(game.teams.len()) as u32;
    let reputation = team.reputation;
    let mut targets = ObjectiveTargets::new(reputation, num_teams);
    let rank = 1 + game
        .teams
        .iter()
        .filter(|other| {
            other.reputation > reputation
                && game.league.as_ref().is_some_and(|league| {
                    league
                        .standings
                        .iter()
                        .any(|standing| standing.team_id == other.id)
                })
        })
        .count() as u32;
    let season = game
        .league
        .as_ref()
        .map(|league| league.season)
        .unwrap_or(1);
    let first_season = game
        .board_rooms
        .get(&user_team_id)
        .is_none_or(|room| room.joined_season == season);
    targets.expected_pos = crate::board_targets::league_target(rank, num_teams, first_season);
    if let Some(room) = game.board_rooms.get_mut(&user_team_id) {
        room.baseline_target = targets.expected_pos;
        room.style_matches = 0;
        room.credited_matches.clear();
    }
    if let Some(contract) = game
        .board_rooms
        .get_mut(&user_team_id)
        .and_then(|room| room.contract.as_mut())
    {
        contract.league_target = targets.expected_pos;
    }

    game.board_objectives = vec![
        BoardObjective {
            id: "obj_position".to_string(),
            description: "boardObjectives.objective.LeaguePosition".to_string(),
            target: targets.expected_pos,
            objective_type: ObjectiveType::LeaguePosition,
            met: false,
        },
        BoardObjective {
            id: "obj_wins".to_string(),
            description: "boardObjectives.objective.Wins".to_string(),
            target: targets.win_target,
            objective_type: ObjectiveType::Wins,
            met: false,
        },
        BoardObjective {
            id: "obj_goals".to_string(),
            description: "boardObjectives.objective.GoalsScored".to_string(),
            target: targets.goals_target,
            objective_type: ObjectiveType::GoalsScored,
            met: false,
        },
        BoardObjective {
            id: "obj_finance".to_string(),
            description: "boardObjectives.objective.FinancialStability".to_string(),
            target: targets.finance_target,
            objective_type: ObjectiveType::FinancialStability,
            met: false,
        },
    ];

    let young_count = game
        .players
        .iter()
        .filter(|player| {
            player.team_id.as_deref() == Some(&user_team_id)
                && player.squad_role == domain::player::SquadRole::Senior
                && is_young(player, game)
        })
        .count() as u32;
    if young_count > 0 && num_teams > 1 {
        let target = (young_count.min(3) * (num_teams - 1) * 15).min(900);
        game.board_objectives.push(BoardObjective {
            id: "obj_youth".to_string(),
            description: "boardObjectives.objective.YouthMinutes".to_string(),
            target,
            objective_type: ObjectiveType::YouthMinutes,
            met: false,
        });
        if let Some(contract) = game
            .board_rooms
            .get_mut(&user_team_id)
            .and_then(|room| room.contract.as_mut())
        {
            contract.youth_minutes_target = target;
        }
    }
    if game.board_rooms.contains_key(&user_team_id) && num_teams > 1 {
        game.board_objectives.push(BoardObjective {
            id: "obj_style".to_string(),
            description: "boardObjectives.objective.PlayingStyleMatches".to_string(),
            target: num_teams - 1,
            objective_type: ObjectiveType::PlayingStyleMatches,
            met: false,
        });
    }

    // Send inbox message about objectives
    let today = game.clock.current_date.format("%Y-%m-%d").to_string();
    // The ledger, not the mailbox: a message the player deleted was still sent.
    // Borrowed, not cloned — the ledger is never pruned, so it only grows.
    let existing_ids = &game.emitted_events;
    let season = game.league.as_ref().map(|l| l.season).unwrap_or(1);
    let msg_id = board_message_id(season);
    if !existing_ids.contains(&msg_id) {
        let msg = build_objectives_message(&targets, season, today);
        crate::inbox::emit(game, msg);
    }
}

/// Update objective progress based on current standings. Called daily.
pub fn update_objective_progress(game: &mut Game) {
    let user_team_id = match &game.manager.team_id {
        Some(id) => id.clone(),
        None => return,
    };

    let league = match &game.league {
        Some(l) => l,
        None => return,
    };

    let standings = league.sorted_standings();
    let user_pos = standings
        .iter()
        .position(|s| s.team_id == user_team_id)
        .map(|i| (i + 1) as u32)
        .unwrap_or(99);
    let user_standing = standings.iter().find(|s| s.team_id == user_team_id);

    let league_complete = end_of_season::is_league_complete(league);

    // Count user goals from completed fixtures
    let user_goals: u32 = league
        .fixtures
        .iter()
        .filter(|f| f.status == FixtureStatus::Completed && f.result.is_some())
        .map(|f| {
            let r = f.result.as_ref().unwrap();
            if f.home_team_id == user_team_id {
                r.home_goals as u32
            } else if f.away_team_id == user_team_id {
                r.away_goals as u32
            } else {
                0
            }
        })
        .sum();

    let user_wins = user_standing.map(|s| s.won).unwrap_or(0);
    let finance_snapshot = finances::team_finance_snapshot(game, &user_team_id);

    let youth_minutes = game
        .players
        .iter()
        .filter(|player| player.team_id.as_deref() == Some(&user_team_id) && is_young(player, game))
        .fold(0_u32, |total, player| {
            total.saturating_add(player.stats.minutes_played)
        });
    let style_matches = game
        .board_rooms
        .get(&user_team_id)
        .map(|room| room.style_matches)
        .unwrap_or(0);
    for obj in game.board_objectives.iter_mut() {
        obj.met = league_complete
            && match obj.objective_type {
                ObjectiveType::LeaguePosition => user_pos <= obj.target,
                ObjectiveType::Wins => user_wins >= obj.target,
                ObjectiveType::GoalsScored => user_goals >= obj.target,
                ObjectiveType::YouthMinutes => youth_minutes >= obj.target,
                ObjectiveType::PlayingStyleMatches => style_matches >= obj.target,
                ObjectiveType::FinancialStability => {
                    finance_snapshot.as_ref().is_some_and(|snapshot| {
                        !snapshot.currently_in_debt
                            && snapshot.wage_budget_usage_percent <= obj.target
                    })
                }
            };
    }
}

/// Evaluate objectives at end of season. Returns satisfaction delta.
pub fn evaluate_objectives(game: &Game) -> i8 {
    if game.board_objectives.is_empty() {
        return 0;
    }
    let met_count = game.board_objectives.iter().filter(|o| o.met).count();
    let total = game.board_objectives.len();

    satisfaction_delta(met_count, total)
}

fn is_young(player: &domain::player::Player, game: &Game) -> bool {
    chrono::NaiveDate::parse_from_str(&player.date_of_birth, "%Y-%m-%d")
        .ok()
        .is_some_and(|born| {
            game.clock
                .current_date
                .date_naive()
                .years_since(born)
                .is_some_and(|age| age <= 21)
        })
}

#[cfg(test)]
mod tests;
