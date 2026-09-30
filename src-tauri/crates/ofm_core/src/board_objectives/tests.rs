#[test]
fn small_league_goal_targets_scale_with_available_matches() {
    assert_eq!(super::ObjectiveTargets::new(900, 4).goals_target, 9);
    assert!(super::ObjectiveTargets::new(700, 4).goals_target <= 6);
    assert!(super::ObjectiveTargets::new(300, 4).goals_target <= 6);
}

use super::{evaluate_objectives, generate_objectives, update_objective_progress};
use crate::clock::GameClock;
use crate::game::{BoardObjective, Game, ObjectiveType};
use chrono::{TimeZone, Utc};
use domain::league::{
    Fixture, FixtureCompetition, FixtureStatus, League, MatchResult, StandingEntry,
};
use domain::manager::Manager;
use domain::message::{InboxMessage, MessageCategory, MessagePriority};
use domain::player::{Player, PlayerAttributes, Position};
use domain::team::Team;

fn default_attrs() -> PlayerAttributes {
    PlayerAttributes {
        pace: 60,
        stamina: 60,
        strength: 60,
        agility: 60,
        passing: 60,
        shooting: 60,
        tackling: 60,
        dribbling: 60,
        defending: 60,
        positioning: 60,
        vision: 60,
        decisions: 60,
        composure: 60,
        aggression: 60,
        teamwork: 60,
        leadership: 60,
        handling: 30,
        reflexes: 30,
        aerial: 60,
    }
}

fn make_player(id: &str, team_id: &str, wage: u32) -> Player {
    let mut player = Player::new(
        id.to_string(),
        "Player".to_string(),
        "Player".to_string(),
        "1995-01-01".to_string(),
        "England".to_string(),
        Position::Forward,
        default_attrs(),
    );
    player.team_id = Some(team_id.to_string());
    player.wage = wage;
    player
}

fn make_team(id: &str, name: &str, reputation: u32) -> Team {
    let mut team = Team::new(
        id.to_string(),
        name.to_string(),
        name.to_string(),
        "England".to_string(),
        "Testville".to_string(),
        "Test Ground".to_string(),
        20_000,
    );
    team.reputation = reputation;
    team
}

fn make_game(user_reputation: u32, season: u32, team_count: usize) -> Game {
    let clock = GameClock::new(Utc.with_ymd_and_hms(2025, 8, 1, 12, 0, 0).unwrap());
    let mut manager = Manager::new(
        "mgr1".to_string(),
        "Alex".to_string(),
        "Manager".to_string(),
        "1980-01-01".to_string(),
        "England".to_string(),
    );
    manager.hire("team1".to_string());

    let teams: Vec<Team> = (1..=team_count)
        .map(|idx| {
            make_team(
                &format!("team{}", idx),
                &format!("Team {}", idx),
                if idx == 1 { user_reputation } else { 500 },
            )
        })
        .collect();
    let team_ids: Vec<String> = teams.iter().map(|team| team.id.clone()).collect();

    let mut game = Game::new(clock, manager, teams, vec![], vec![], vec![]);
    game.league = Some(League::new(
        "league1".to_string(),
        "Test League".to_string(),
        season,
        &team_ids,
    ));
    game
}

fn make_objective(
    id: &str,
    objective_type: ObjectiveType,
    target: u32,
    met: bool,
) -> BoardObjective {
    BoardObjective {
        id: id.to_string(),
        description: format!("Objective {}", id),
        target,
        objective_type,
        met,
    }
}

fn objective_by_id<'a>(game: &'a Game, id: &str) -> &'a BoardObjective {
    game.board_objectives
        .iter()
        .find(|objective| objective.id == id)
        .unwrap()
}

#[test]
fn generate_objectives_creates_targets_and_board_message() {
    let mut game = make_game(800, 3, 4);

    generate_objectives(&mut game);

    assert_eq!(game.board_objectives.len(), 4);
    assert_eq!(objective_by_id(&game, "obj_position").target, 2);
    assert_eq!(
        objective_by_id(&game, "obj_position").description,
        "boardObjectives.objective.LeaguePosition"
    );
    assert_eq!(objective_by_id(&game, "obj_wins").target, 3);
    assert_eq!(
        objective_by_id(&game, "obj_wins").description,
        "boardObjectives.objective.Wins"
    );
    assert_eq!(objective_by_id(&game, "obj_goals").target, 9);
    assert_eq!(
        objective_by_id(&game, "obj_goals").description,
        "boardObjectives.objective.GoalsScored"
    );
    assert_eq!(objective_by_id(&game, "obj_finance").target, 100);
    assert_eq!(
        objective_by_id(&game, "obj_finance").description,
        "boardObjectives.objective.FinancialStability"
    );

    let message = game
        .messages
        .iter()
        .find(|message| message.id == "board_objectives_3")
        .unwrap();
    assert_eq!(message.category, MessageCategory::BoardDirective);
    assert_eq!(message.priority, MessagePriority::High);
    assert_eq!(message.sender_role, "Chairman");
    assert_eq!(
        message.subject_key.as_deref(),
        Some("be.msg.boardObjectives.subject")
    );
    assert_eq!(
        message.body_key.as_deref(),
        Some("be.msg.boardObjectives.body")
    );
    assert_eq!(
        message.sender_key.as_deref(),
        Some("be.sender.boardOfDirectors")
    );
    assert_eq!(message.sender_role_key.as_deref(), Some("be.role.chairman"));
    assert_eq!(message.i18n_params.get("season"), Some(&"3".to_string()));
    assert_eq!(
        message.i18n_params.get("expectedPos"),
        Some(&"2".to_string())
    );
    assert_eq!(message.i18n_params.get("winTarget"), Some(&"3".to_string()));
    assert_eq!(
        message.i18n_params.get("goalsTarget"),
        Some(&"9".to_string())
    );
    assert_eq!(
        message.i18n_params.get("financeTarget"),
        Some(&"100".to_string())
    );
}

#[test]
fn generate_objectives_stays_feasible_for_a_single_team_world() {
    // League participant counts <= 1 fall back to the raw team count, which
    // can also be 1 in a degenerate world; targets must stay achievable
    // instead of demanding wins/goals from zero matchdays.
    let mut game = make_game(500, 1, 1);

    generate_objectives(&mut game);

    assert_eq!(objective_by_id(&game, "obj_position").target, 1);
    assert_eq!(objective_by_id(&game, "obj_wins").target, 0);
    assert_eq!(objective_by_id(&game, "obj_goals").target, 0);
}

#[test]
fn generate_objectives_does_not_duplicate_existing_board_message() {
    let mut game = make_game(60, 2, 4);
    crate::inbox::emit(
        &mut game,
        InboxMessage::new(
            "board_objectives_2".to_string(),
            "Existing".to_string(),
            "Body".to_string(),
            "Board".to_string(),
            "2025-08-01".to_string(),
        )
        .with_category(MessageCategory::BoardDirective)
        .with_priority(MessagePriority::High),
    );

    generate_objectives(&mut game);

    assert_eq!(game.board_objectives.len(), 4);
    assert_eq!(
        game.messages
            .iter()
            .filter(|message| message.id == "board_objectives_2")
            .count(),
        1
    );
}

#[test]
fn generate_objectives_does_not_resend_the_briefing_the_player_deleted() {
    let mut game = make_game(60, 2, 4);
    generate_objectives(&mut game);
    assert_eq!(game.messages.len(), 1);

    game.messages.clear();
    game.board_objectives.clear();
    generate_objectives(&mut game);

    assert!(game.messages.is_empty());
}

#[test]
fn update_objective_progress_keeps_all_objectives_in_progress_until_league_completion() {
    let mut game = make_game(60, 1, 3);
    game.board_objectives = vec![
        make_objective("obj_position", ObjectiveType::LeaguePosition, 1, false),
        make_objective("obj_wins", ObjectiveType::Wins, 4, false),
        make_objective("obj_goals", ObjectiveType::GoalsScored, 6, false),
        make_objective("obj_finance", ObjectiveType::FinancialStability, 100, false),
    ];

    let mut league = game.league.clone().unwrap();
    league.standings = vec![
        StandingEntry {
            team_id: "team1".to_string(),
            played: 4,
            won: 4,
            drawn: 0,
            lost: 0,
            goals_for: 5,
            goals_against: 1,
            points: 12,
        },
        StandingEntry {
            team_id: "team2".to_string(),
            played: 5,
            won: 5,
            drawn: 0,
            lost: 0,
            goals_for: 9,
            goals_against: 2,
            points: 15,
        },
        StandingEntry {
            team_id: "team3".to_string(),
            played: 4,
            won: 1,
            drawn: 0,
            lost: 3,
            goals_for: 2,
            goals_against: 7,
            points: 3,
        },
    ];
    league.fixtures = vec![
        Fixture {
            id: "f1".to_string(),
            matchday: 1,
            date: "2025-08-01".to_string(),
            home_team_id: "team1".to_string(),
            away_team_id: "team2".to_string(),
            competition: FixtureCompetition::League,
            status: FixtureStatus::Completed,
            result: Some(MatchResult {
                home_goals: 2,
                away_goals: 1,
                home_scorers: vec![],
                away_scorers: vec![],
                report: None,
                home_penalties: None,
                away_penalties: None,
            }),
            ..Default::default()
        },
        Fixture {
            id: "f2".to_string(),
            matchday: 2,
            date: "2025-08-08".to_string(),
            home_team_id: "team3".to_string(),
            away_team_id: "team1".to_string(),
            competition: FixtureCompetition::League,
            status: FixtureStatus::Completed,
            result: Some(MatchResult {
                home_goals: 0,
                away_goals: 3,
                home_scorers: vec![],
                away_scorers: vec![],
                report: None,
                home_penalties: None,
                away_penalties: None,
            }),
            ..Default::default()
        },
    ];
    game.league = Some(league);

    update_objective_progress(&mut game);

    assert!(!objective_by_id(&game, "obj_position").met);
    assert!(!objective_by_id(&game, "obj_wins").met);
    assert!(!objective_by_id(&game, "obj_goals").met);
    assert!(!objective_by_id(&game, "obj_finance").met);
}

#[test]
fn update_objective_progress_marks_every_objective_met_once_league_is_complete() {
    let mut game = make_game(60, 1, 2);
    game.board_objectives = vec![
        make_objective("obj_position", ObjectiveType::LeaguePosition, 1, false),
        make_objective("obj_wins", ObjectiveType::Wins, 2, false),
        make_objective("obj_goals", ObjectiveType::GoalsScored, 5, false),
        make_objective("obj_finance", ObjectiveType::FinancialStability, 100, false),
    ];
    game.teams
        .iter_mut()
        .find(|team| team.id == "team1")
        .unwrap()
        .wage_budget = 300_000;
    game.players.push(make_player("player-1", "team1", 220_000));

    let mut league = game.league.clone().unwrap();
    league.standings = vec![
        StandingEntry {
            team_id: "team1".to_string(),
            played: 2,
            won: 2,
            drawn: 0,
            lost: 0,
            goals_for: 5,
            goals_against: 1,
            points: 6,
        },
        StandingEntry {
            team_id: "team2".to_string(),
            played: 2,
            won: 0,
            drawn: 0,
            lost: 2,
            goals_for: 1,
            goals_against: 5,
            points: 0,
        },
    ];
    league.fixtures = vec![
        Fixture {
            id: "f1".to_string(),
            matchday: 1,
            date: "2025-08-01".to_string(),
            home_team_id: "team1".to_string(),
            away_team_id: "team2".to_string(),
            competition: FixtureCompetition::League,
            status: FixtureStatus::Completed,
            result: Some(MatchResult {
                home_goals: 2,
                away_goals: 0,
                home_scorers: vec![],
                away_scorers: vec![],
                report: None,
                home_penalties: None,
                away_penalties: None,
            }),
            ..Default::default()
        },
        Fixture {
            id: "f2".to_string(),
            matchday: 2,
            date: "2025-08-08".to_string(),
            home_team_id: "team2".to_string(),
            away_team_id: "team1".to_string(),
            competition: FixtureCompetition::League,
            status: FixtureStatus::Completed,
            result: Some(MatchResult {
                home_goals: 1,
                away_goals: 3,
                home_scorers: vec![],
                away_scorers: vec![],
                report: None,
                home_penalties: None,
                away_penalties: None,
            }),
            ..Default::default()
        },
    ];
    game.league = Some(league);

    update_objective_progress(&mut game);

    assert!(objective_by_id(&game, "obj_position").met);
    assert!(objective_by_id(&game, "obj_wins").met);
    assert!(objective_by_id(&game, "obj_goals").met);
    assert!(objective_by_id(&game, "obj_finance").met);
}

#[test]
fn update_objective_progress_tracks_financial_stability_from_finance_snapshot_only_after_completion()
 {
    let mut game = make_game(60, 1, 2);
    game.board_objectives = vec![make_objective(
        "obj_finance",
        ObjectiveType::FinancialStability,
        100,
        false,
    )];
    game.teams
        .iter_mut()
        .find(|team| team.id == "team1")
        .unwrap()
        .wage_budget = 100_000;
    game.players.push(make_player("player-1", "team1", 220_000));

    update_objective_progress(&mut game);

    assert!(!objective_by_id(&game, "obj_finance").met);

    let mut league = game.league.clone().unwrap();
    league.standings = vec![
        StandingEntry {
            team_id: "team1".to_string(),
            played: 2,
            won: 2,
            drawn: 0,
            lost: 0,
            goals_for: 3,
            goals_against: 1,
            points: 6,
        },
        StandingEntry {
            team_id: "team2".to_string(),
            played: 2,
            won: 0,
            drawn: 0,
            lost: 2,
            goals_for: 1,
            goals_against: 3,
            points: 0,
        },
    ];
    league.fixtures = vec![
        Fixture {
            id: "f1".to_string(),
            matchday: 1,
            date: "2025-08-01".to_string(),
            home_team_id: "team1".to_string(),
            away_team_id: "team2".to_string(),
            competition: FixtureCompetition::League,
            status: FixtureStatus::Completed,
            result: Some(MatchResult {
                home_goals: 1,
                away_goals: 0,
                home_scorers: vec![],
                away_scorers: vec![],
                report: None,
                home_penalties: None,
                away_penalties: None,
            }),
            ..Default::default()
        },
        Fixture {
            id: "f2".to_string(),
            matchday: 2,
            date: "2025-08-08".to_string(),
            home_team_id: "team2".to_string(),
            away_team_id: "team1".to_string(),
            competition: FixtureCompetition::League,
            status: FixtureStatus::Completed,
            result: Some(MatchResult {
                home_goals: 1,
                away_goals: 1,
                home_scorers: vec![],
                away_scorers: vec![],
                report: None,
                home_penalties: None,
                away_penalties: None,
            }),
            ..Default::default()
        },
    ];
    game.league = Some(league);

    game.teams
        .iter_mut()
        .find(|team| team.id == "team1")
        .unwrap()
        .wage_budget = 300_000;

    update_objective_progress(&mut game);

    assert!(objective_by_id(&game, "obj_finance").met);
}

#[test]
fn update_objective_progress_only_marks_league_position_met_after_all_fixtures_finish() {
    let mut game = make_game(80, 1, 4);
    game.board_objectives = vec![make_objective(
        "obj_position",
        ObjectiveType::LeaguePosition,
        1,
        false,
    )];

    let mut league = game.league.clone().unwrap();
    let fixture = |id: &str,
                   matchday: u32,
                   home_team_id: &str,
                   away_team_id: &str,
                   status: FixtureStatus,
                   score: Option<(u8, u8)>| {
        Fixture {
            id: id.to_string(),
            matchday,
            date: format!("2025-08-{:02}", matchday),
            home_team_id: home_team_id.to_string(),
            away_team_id: away_team_id.to_string(),
            competition: FixtureCompetition::League,
            status,
            result: score.map(|(home_goals, away_goals)| MatchResult {
                home_goals,
                away_goals,
                home_scorers: vec![],
                away_scorers: vec![],
                report: None,
                home_penalties: None,
                away_penalties: None,
            }),
            ..Default::default()
        }
    };
    league.standings = vec![
        StandingEntry {
            team_id: "team1".to_string(),
            played: 6,
            won: 5,
            drawn: 1,
            lost: 0,
            goals_for: 12,
            goals_against: 3,
            points: 16,
        },
        StandingEntry {
            team_id: "team2".to_string(),
            played: 6,
            won: 3,
            drawn: 1,
            lost: 2,
            goals_for: 7,
            goals_against: 6,
            points: 10,
        },
        StandingEntry {
            team_id: "team3".to_string(),
            played: 6,
            won: 1,
            drawn: 2,
            lost: 3,
            goals_for: 4,
            goals_against: 8,
            points: 5,
        },
        StandingEntry {
            team_id: "team4".to_string(),
            played: 6,
            won: 0,
            drawn: 2,
            lost: 4,
            goals_for: 2,
            goals_against: 8,
            points: 2,
        },
    ];
    league.fixtures = vec![
        fixture(
            "f1",
            1,
            "team1",
            "team2",
            FixtureStatus::Completed,
            Some((2, 0)),
        ),
        fixture(
            "f2",
            2,
            "team3",
            "team4",
            FixtureStatus::Completed,
            Some((1, 0)),
        ),
        fixture(
            "f3",
            3,
            "team1",
            "team3",
            FixtureStatus::Completed,
            Some((3, 1)),
        ),
        fixture(
            "f4",
            4,
            "team2",
            "team4",
            FixtureStatus::Completed,
            Some((2, 1)),
        ),
        fixture(
            "f5",
            5,
            "team1",
            "team4",
            FixtureStatus::Completed,
            Some((2, 0)),
        ),
        fixture(
            "f6",
            6,
            "team2",
            "team3",
            FixtureStatus::Completed,
            Some((1, 1)),
        ),
        fixture(
            "f7",
            7,
            "team2",
            "team1",
            FixtureStatus::Completed,
            Some((0, 1)),
        ),
        fixture(
            "f8",
            8,
            "team4",
            "team3",
            FixtureStatus::Completed,
            Some((0, 0)),
        ),
        fixture(
            "f9",
            9,
            "team3",
            "team1",
            FixtureStatus::Completed,
            Some((0, 2)),
        ),
        fixture(
            "f10",
            10,
            "team4",
            "team2",
            FixtureStatus::Completed,
            Some((1, 2)),
        ),
        fixture(
            "f11",
            11,
            "team4",
            "team1",
            FixtureStatus::Completed,
            Some((1, 2)),
        ),
        fixture("f12", 12, "team3", "team2", FixtureStatus::Scheduled, None),
    ];
    game.league = Some(league.clone());

    update_objective_progress(&mut game);

    assert!(!objective_by_id(&game, "obj_position").met);

    league.fixtures[11].status = FixtureStatus::Completed;
    league.fixtures[11].result = Some(MatchResult {
        home_goals: 0,
        away_goals: 1,
        home_scorers: vec![],
        away_scorers: vec![],
        report: None,
        home_penalties: None,
        away_penalties: None,
    });
    game.league = Some(league);

    update_objective_progress(&mut game);

    assert!(objective_by_id(&game, "obj_position").met);
}

#[test]
fn evaluate_objectives_distinguishes_some_met_from_majority_met() {
    let mut game = make_game(60, 1, 3);

    assert_eq!(evaluate_objectives(&game), 0);

    game.board_objectives = vec![
        make_objective("a", ObjectiveType::LeaguePosition, 1, true),
        make_objective("b", ObjectiveType::Wins, 1, false),
        make_objective("c", ObjectiveType::GoalsScored, 1, false),
    ];
    assert_eq!(evaluate_objectives(&game), -5);

    game.board_objectives = vec![
        make_objective("a", ObjectiveType::LeaguePosition, 1, true),
        make_objective("b", ObjectiveType::Wins, 1, true),
        make_objective("c", ObjectiveType::GoalsScored, 1, false),
    ];
    assert_eq!(evaluate_objectives(&game), 5);

    game.board_objectives = vec![
        make_objective("a", ObjectiveType::LeaguePosition, 1, true),
        make_objective("b", ObjectiveType::Wins, 1, true),
        make_objective("c", ObjectiveType::GoalsScored, 1, true),
    ];
    assert_eq!(evaluate_objectives(&game), 15);

    game.board_objectives = vec![
        make_objective("a", ObjectiveType::LeaguePosition, 1, true),
        make_objective("b", ObjectiveType::Wins, 1, true),
        make_objective("c", ObjectiveType::GoalsScored, 1, false),
        make_objective("d", ObjectiveType::GoalsScored, 1, false),
    ];
    assert_eq!(evaluate_objectives(&game), -5);

    game.board_objectives = vec![
        make_objective("a", ObjectiveType::LeaguePosition, 1, false),
        make_objective("b", ObjectiveType::Wins, 1, false),
        make_objective("c", ObjectiveType::GoalsScored, 1, false),
    ];
    assert_eq!(evaluate_objectives(&game), -15);
}
