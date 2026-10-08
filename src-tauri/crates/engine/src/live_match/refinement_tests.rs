use super::*;
use crate::{GoalSource, Position};
use rand::{SeedableRng, rngs::StdRng};

fn make_player(id: &str, name: &str, pos: Position, skill: u8) -> PlayerData {
    PlayerData {
        id: id.to_string(),
        name: name.to_string(),
        position: pos,
        ovr: skill,
        condition: 90,
        fitness: 75,
        pace: skill,
        stamina: skill,
        strength: skill,
        agility: skill,
        passing: skill,
        shooting: skill,
        tackling: skill,
        dribbling: skill,
        defending: skill,
        positioning: skill,
        vision: skill,
        decisions: skill,
        composure: skill,
        aggression: skill,
        teamwork: skill,
        leadership: skill,
        handling: skill,
        reflexes: skill,
        aerial: skill,
        traits: vec![],
        role: PlayerRole::Standard,
    }
}

fn make_team(id: &str, name: &str, skill: u8, style: PlayStyle) -> TeamData {
    let players = vec![
        make_player(&format!("{}_gk", id), "GK", Position::Goalkeeper, skill),
        make_player(&format!("{}_def1", id), "DEF1", Position::Defender, skill),
        make_player(&format!("{}_def2", id), "DEF2", Position::Defender, skill),
        make_player(&format!("{}_def3", id), "DEF3", Position::Defender, skill),
        make_player(&format!("{}_def4", id), "DEF4", Position::Defender, skill),
        make_player(&format!("{}_mid1", id), "MID1", Position::Midfielder, skill),
        make_player(&format!("{}_mid2", id), "MID2", Position::Midfielder, skill),
        make_player(&format!("{}_mid3", id), "MID3", Position::Midfielder, skill),
        make_player(&format!("{}_mid4", id), "MID4", Position::Midfielder, skill),
        make_player(&format!("{}_fwd1", id), "FWD1", Position::Forward, skill),
        make_player(&format!("{}_fwd2", id), "FWD2", Position::Forward, skill),
    ];
    TeamData {
        id: id.to_string(),
        name: name.to_string(),
        formation: "4-4-2".to_string(),
        play_style: style,
        tactics: TacticsConfig::default(),
        players,
    }
}

fn make_bench(id: &str, skill: u8) -> Vec<PlayerData> {
    vec![
        make_player(
            &format!("{}_sub_gk", id),
            "SUB_GK",
            Position::Goalkeeper,
            skill,
        ),
        make_player(
            &format!("{}_sub_def", id),
            "SUB_DEF",
            Position::Defender,
            skill,
        ),
        make_player(
            &format!("{}_sub_mid", id),
            "SUB_MID",
            Position::Midfielder,
            skill,
        ),
        make_player(
            &format!("{}_sub_fwd1", id),
            "SUB_FWD1",
            Position::Forward,
            skill,
        ),
        make_player(
            &format!("{}_sub_fwd2", id),
            "SUB_FWD2",
            Position::Forward,
            skill,
        ),
    ]
}

fn make_live_match(allows_extra_time: bool) -> LiveMatchState {
    let home = make_team("home", "Home FC", 70, PlayStyle::Balanced);
    let away = make_team("away", "Away FC", 70, PlayStyle::Balanced);
    let home_bench = make_bench("home", 65);
    let away_bench = make_bench("away", 65);
    LiveMatchState::new(
        home,
        away,
        MatchConfig::default(),
        home_bench,
        away_bench,
        allows_extra_time,
    )
}


#[test]
fn refinement_substitute_minutes_after_exit() {
    let substitution = |minute, incoming: &str, outgoing: &str| {
        MatchEvent::new(minute, EventType::Substitution, Side::Home, Zone::Midfield)
            .with_player(incoming).with_secondary(outgoing)
    };
    let dismissal = MatchEvent::new(80, EventType::RedCard, Side::Home, Zone::Midfield)
        .with_player("sub");
    let report = MatchReport::from_events_with_players(
        vec![substitution(60, "sub", "starter"), dismissal], 50, 50, 90, vec!["starter".into()],
    );
    assert_eq!(report.player_stats["sub"].minutes_played, 20);
    assert_eq!(report.player_stats["starter"].minutes_played, 60);
    let report = MatchReport::from_events_with_players(
        vec![substitution(60, "sub", "starter"), substitution(80, "next", "sub")],
        50, 50, 90, vec!["next".into()],
    );
    assert_eq!(report.player_stats["sub"].minutes_played, 20);
    assert_eq!(report.player_stats["next"].minutes_played, 10);
}

#[test]
fn refinement_large_possession_counters() {
    let report = MatchReport::from_events(vec![], u32::MAX, u32::MAX, 90);
    assert_eq!(report.home_possession, 50.0);
    let mut state = make_live_match(false);
    state.home_possession_ticks = u32::MAX;
    state.away_possession_ticks = u32::MAX;
    assert_eq!(state.snapshot().home_possession_pct, 50.0);
}

#[test]
fn refinement_imported_shot_probability() {
    let mut invalid = MatchEvent::new(12, EventType::ShotOffTarget, Side::Home, Zone::AwayDefense)
        .with_player("shooter").with_shot(0.2, "keeper");
    invalid.shot.as_mut().unwrap().expected_goals = f64::NAN;
    let mut excessive = invalid.clone();
    excessive.shot.as_mut().unwrap().expected_goals = 5.0;
    let report = MatchReport::from_events(vec![invalid, excessive], 50, 50, 90);
    assert_eq!(report.home_stats.expected_goals, 1.0);
    assert_eq!(report.player_stats["shooter"].expected_goals, 1.0);
}

#[test]
fn refinement_empty_assist_identity() {
    let goal = MatchEvent::new(12, EventType::Goal, Side::Home, Zone::AwayDefense)
        .with_player("scorer").with_secondary("");
    let report = MatchReport::from_events(vec![goal], 50, 50, 90);
    assert_eq!(report.goals[0].assist_id, None);
    assert!(!report.player_stats.contains_key(""));
}

#[test]
fn refinement_expired_set_piece_source() {
    let corner = MatchEvent::new(12, EventType::Corner, Side::Home, Zone::AwayDefense);
    let goal = MatchEvent::new(20, EventType::Goal, Side::Home, Zone::AwayDefense).with_player("scorer");
    let report = MatchReport::from_events(vec![corner, goal], 50, 50, 90);
    assert_eq!(report.goals[0].goal_source, GoalSource::OpenPlay);
}

#[test]
fn refinement_harmless_free_kick_resets_source() {
    let corner = MatchEvent::new(12, EventType::Corner, Side::Home, Zone::AwayDefense);
    let free_kick = MatchEvent::new(12, EventType::FreeKick, Side::Home, Zone::HomeDefense);
    let goal = MatchEvent::new(12, EventType::Goal, Side::Home, Zone::AwayDefense).with_player("scorer");
    let report = MatchReport::from_events(vec![corner, free_kick, goal], 50, 50, 90);
    assert_eq!(report.goals[0].goal_source, GoalSource::OpenPlay);
}

#[test]
fn refinement_fatigue_cannot_restore_condition() {
    let mut state = make_live_match(false);
    state.home.players[0].stamina = 100;
    state.home.players[0].fitness = 255;
    state.player_conditions.insert("home_gk".into(), 30.0);
    state.deplete_stamina_tick();
    assert!(state.player_conditions["home_gk"] <= 30.0);
    state.player_conditions.insert("home_gk".into(), 1.0);
    state.deplete_stamina_tick();
    assert!(state.player_conditions["home_gk"] <= 1.0);
}

#[test]
fn refinement_snapshot_condition_bounds() {
    let mut state = make_live_match(false);
    state.player_conditions.insert("home_gk".into(), 255.0);
    assert_eq!(state.snapshot().home_team.players[0].condition, 100);
    state.player_conditions.insert("home_gk".into(), f64::NAN);
    assert_eq!(state.snapshot().home_team.players[0].condition, 50);
}

#[test]
fn refinement_pre_kickoff_substitution_accounting() {
    let mut state = make_live_match(false);
    state.apply_command(MatchCommand::Substitute {
        side: Side::Home, player_off_id: "home_fwd1".into(), player_on_id: "home_sub_fwd1".into(),
    }).unwrap();
    assert_eq!(state.home_subs_made, 0);
    assert!(state.substitutions.is_empty());
    assert!(state.events.is_empty());
    assert_eq!(state.home.players[9].id, "home_sub_fwd1");
}
