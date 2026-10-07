use ::engine::*;
use rand::SeedableRng;
use rand::rngs::StdRng;
fn seeded_rng(seed: u64) -> StdRng {
    StdRng::seed_from_u64(seed)
}

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

fn state(extra_time: bool, stoppage: u8) -> LiveMatchState {
    LiveMatchState::new(
        make_team("h", "Home", 65, PlayStyle::Balanced),
        make_team("a", "Away", 65, PlayStyle::Balanced),
        MatchConfig {
            stoppage_time_max: stoppage,
            ..MatchConfig::default()
        },
        vec![],
        vec![],
        extra_time,
    )
}
#[test]
fn regulation_runs_ninety_action_minutes_without_stoppage() {
    let mut state = state(false, 0);
    let mut rng = seeded_rng(71);
    let mut action_minutes = 0;
    for _ in 0..200 {
        let before = state.minute();
        let result = state.step_minute(&mut rng);
        if result.minute > before
            && result
                .events
                .iter()
                .all(|e| e.event_type != EventType::SecondHalfStart)
        {
            action_minutes += 1;
        }
        if result.is_finished {
            break;
        }
    }
    assert_eq!(action_minutes, 90);
}
#[test]
fn match_event_clock_never_rewinds_in_knockouts() {
    for seed in 0..100 {
        let mut state = state(true, 8);
        let mut rng = seeded_rng(seed);
        let mut previous = 0;
        for _ in 0..250 {
            let result = state.step_minute(&mut rng);
            assert!(result.minute >= previous);
            previous = result.minute;
            if result.is_finished {
                break;
            }
        }
    }
}
#[test]
fn shot_metadata_is_finite_and_legacy_safe() {
    let report = simulate_with_rng(
        &make_team("h", "H", 65, PlayStyle::Balanced),
        &make_team("a", "A", 65, PlayStyle::Balanced),
        &MatchConfig::default(),
        &mut seeded_rng(3),
    );
    assert!(report.events.iter().any(|e| e.shot.is_some()));
    for event in report.events {
        if let Some(shot) = event.shot {
            assert!(shot.expected_goals.is_finite() && (0.0..=1.0).contains(&shot.expected_goals));
        }
    }
}
#[test]
fn report_xg_matches_each_attempt_once() {
    let report = simulate_with_rng(
        &make_team("h", "H", 65, PlayStyle::Balanced),
        &make_team("a", "A", 65, PlayStyle::Balanced),
        &MatchConfig::default(),
        &mut seeded_rng(30),
    );
    let total: f64 = report
        .events
        .iter()
        .filter_map(|e| e.shot.as_ref())
        .map(|s| s.expected_goals)
        .sum();
    assert!(
        (total - report.home_stats.expected_goals - report.away_stats.expected_goals).abs() < 1e-9
    );
}
#[test]
fn live_tactical_changes_are_logged_once() {
    let mut state = state(false, 0);
    state.step_minute(&mut seeded_rng(1));
    for _ in 0..2 {
        state
            .apply_command(MatchCommand::ChangePlayStyle {
                side: Side::Home,
                play_style: PlayStyle::Attacking,
            })
            .unwrap();
    }
    assert_eq!(
        state
            .snapshot()
            .events
            .iter()
            .filter(|e| e.event_type == EventType::TacticalChange)
            .count(),
        1
    );
}
#[test]
fn self_assists_do_not_inflate_player_statistics() {
    let event = MatchEvent::new(10, EventType::Goal, Side::Home, Zone::AwayBox)
        .with_player("p")
        .with_secondary("p");
    let report = MatchReport::from_events(vec![event], 1, 1, 90);
    assert_eq!(report.player_stats["p"].assists, 0);
    assert!(report.goals[0].assist_id.is_none());
}

#[test]
fn booked_substitutes_stay_on_the_correct_team() { let mut s=LiveMatchState::new(make_team("h","H",65,PlayStyle::Balanced),make_team("a","A",65,PlayStyle::Balanced),MatchConfig { foul_probability:1.0,yellow_card_probability:1.0,red_card_probability:0.0,injury_probability:0.0,..MatchConfig::default() },vec![make_player("reserve","Reserve",Position::Midfielder,65)],vec![],false); let mut rng=seeded_rng(4); for _ in 0..30 { s.step_minute(&mut rng); let snap=s.snapshot(); if let Some(id)=snap.home_yellows.keys().find(|id| !snap.sent_off.contains(*id)).cloned() { s.apply_command(MatchCommand::Substitute {side:Side::Home,player_off_id:id.clone(),player_on_id:"reserve".into()}).unwrap(); let after=s.snapshot(); assert!(after.home_yellows.contains_key(&id)); assert!(!after.away_yellows.contains_key(&id)); return; } } panic!("seed must produce a home booking"); }

#[test]
fn incoming_players_do_not_keep_an_invalid_slot_role() { let mut reserve=make_player("reserve","Reserve",Position::Forward,65); reserve.role=PlayerRole::PressingForward; let mut s=LiveMatchState::new(make_team("h","H",65,PlayStyle::Balanced),make_team("a","A",65,PlayStyle::Balanced),MatchConfig::default(),vec![reserve],vec![],false); s.step_minute(&mut seeded_rng(1)); s.apply_command(MatchCommand::Substitute{side:Side::Home,player_off_id:"h_def1".into(),player_on_id:"reserve".into()}).unwrap(); assert_eq!(s.snapshot().home_team.players.iter().find(|p| p.id=="reserve").unwrap().role,PlayerRole::Standard); }

#[test]
fn ai_does_not_replace_tired_outfield_players_with_goalkeepers() { let mut home=make_team("h","H",65,PlayStyle::Balanced); for p in &mut home.players { p.condition=10; } let mut s=LiveMatchState::new(home,make_team("a","A",65,PlayStyle::Balanced),MatchConfig::default(),vec![make_player("reserve","Reserve",Position::Goalkeeper,90)],vec![],false); s.step_minute(&mut seeded_rng(1)); let commands=ai_decide(&s,Side::Home,&AiProfile::default(),&mut seeded_rng(2)); assert!(commands.iter().all(|c| !matches!(c,MatchCommand::Substitute{..}))); }
