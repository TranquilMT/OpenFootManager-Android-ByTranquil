use super::*;
use crate::{GoalSource, Position, TacticsConfig};
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
            .with_player(incoming)
            .with_secondary(outgoing)
    };
    let dismissal =
        MatchEvent::new(80, EventType::RedCard, Side::Home, Zone::Midfield).with_player("sub");
    let report = MatchReport::from_events_with_players(
        vec![substitution(60, "sub", "starter"), dismissal],
        50,
        50,
        90,
        vec!["starter".into()],
    );
    assert_eq!(report.player_stats["sub"].minutes_played, 20);
    assert_eq!(report.player_stats["starter"].minutes_played, 60);
    let report = MatchReport::from_events_with_players(
        vec![
            substitution(60, "sub", "starter"),
            substitution(80, "next", "sub"),
        ],
        50,
        50,
        90,
        vec!["next".into()],
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
        .with_player("shooter")
        .with_shot(0.2, "keeper");
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
        .with_player("scorer")
        .with_secondary("");
    let report = MatchReport::from_events(vec![goal], 50, 50, 90);
    assert_eq!(report.goals[0].assist_id, None);
    assert!(!report.player_stats.contains_key(""));
}

#[test]
fn refinement_expired_set_piece_source() {
    let corner = MatchEvent::new(12, EventType::Corner, Side::Home, Zone::AwayDefense);
    let goal =
        MatchEvent::new(20, EventType::Goal, Side::Home, Zone::AwayDefense).with_player("scorer");
    let report = MatchReport::from_events(vec![corner, goal], 50, 50, 90);
    assert_eq!(report.goals[0].goal_source, GoalSource::OpenPlay);
}

#[test]
fn refinement_harmless_free_kick_resets_source() {
    let corner = MatchEvent::new(12, EventType::Corner, Side::Home, Zone::AwayDefense);
    let free_kick = MatchEvent::new(12, EventType::FreeKick, Side::Home, Zone::HomeDefense);
    let goal =
        MatchEvent::new(12, EventType::Goal, Side::Home, Zone::AwayDefense).with_player("scorer");
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
    state
        .apply_command(MatchCommand::Substitute {
            side: Side::Home,
            player_off_id: "home_fwd1".into(),
            player_on_id: "home_sub_fwd1".into(),
        })
        .unwrap();
    assert_eq!(state.home_subs_made, 0);
    assert!(state.substitutions.is_empty());
    assert!(state.events.is_empty());
    assert_eq!(state.home.players[9].id, "home_sub_fwd1");
}

#[test]
fn refinement_dismissed_pre_match_swap_is_atomic() {
    let mut state = make_live_match(false);
    state.sent_off.insert("home_sub_fwd1".into());
    let before = serde_json::to_value(state.snapshot()).unwrap();
    assert!(
        state
            .apply_command(MatchCommand::PreMatchSwap {
                side: Side::Home,
                player_off_id: "home_fwd1".into(),
                player_on_id: "home_sub_fwd1".into(),
            })
            .is_err()
    );
    assert_eq!(serde_json::to_value(state.snapshot()).unwrap(), before);
}

#[test]
fn refinement_invalid_formation_matches_applied_shape() {
    let mut state = make_live_match(false);
    state
        .apply_command(MatchCommand::ChangeFormation {
            side: Side::Home,
            formation: "3-nope-5-2".into(),
        })
        .unwrap();
    assert_eq!(state.snapshot().home_team.formation, "4-4-2");
    state
        .apply_command(MatchCommand::ChangeFormation {
            side: Side::Home,
            formation: "4-2-3-1".into(),
        })
        .unwrap();
    assert_eq!(state.snapshot().home_team.formation, "4-2-3-1");
}

#[test]
fn refinement_effective_rating_condition_cap() {
    let mut player = make_player("p", "Player", Position::Forward, 70);
    player.condition = 255;
    assert_eq!(player.effective_overall(), 70.0);
}

#[test]
fn refinement_overall_attribute_scale() {
    let player = make_player("p", "Player", Position::Forward, 255);
    assert_eq!(player.overall(), 100.0);
    assert_eq!(
        make_player("normal", "Normal", Position::Forward, 70).overall(),
        70.0
    );
}

#[test]
fn refinement_all_dismissed_player_selection() {
    let mut state = make_live_match(false);
    for player in &state.home.players {
        state.sent_off.insert(player.id.clone());
    }
    let mut rng = StdRng::seed_from_u64(1);
    assert!(
        crate::shared::snap_from_squad(
            &state.home.players,
            &state.sent_off,
            Position::Forward,
            &mut rng
        )
        .is_none()
    );
}

#[test]
fn refinement_penalty_award_counted_once() {
    for outcome in [EventType::PenaltyGoal, EventType::PenaltyMiss] {
        let award = MatchEvent::new(12, EventType::PenaltyAwarded, Side::Home, Zone::AwayDefense);
        let kick = MatchEvent::new(12, outcome, Side::Home, Zone::AwayDefense).with_player("taker");
        let report = MatchReport::from_events(vec![award, kick.clone()], 50, 50, 90);
        assert_eq!(report.home_stats.penalties, 1);
        let legacy = MatchReport::from_events(vec![kick], 50, 50, 90);
        assert_eq!(legacy.home_stats.penalties, 1);
    }
}

#[test]
fn refinement_second_yellow_counts_dismissal() {
    let first =
        MatchEvent::new(12, EventType::YellowCard, Side::Home, Zone::Midfield).with_player("p");
    let second =
        MatchEvent::new(30, EventType::SecondYellow, Side::Home, Zone::Midfield).with_player("p");
    let report = MatchReport::from_events(vec![first, second], 50, 50, 90);
    assert_eq!(report.home_stats.yellow_cards, 2);
    assert_eq!(report.home_stats.red_cards, 1);
    assert_eq!(report.player_stats["p"].red_cards, 1);
}

#[test]
fn phase74_shootout_uses_distinct_eligible_takers() {
    let mut s = make_live_match(true);
    s.phase = MatchPhase::PenaltyShootout;
    s.current_minute = 120;
    let mut rng = StdRng::seed_from_u64(741);
    let mut takers = std::collections::HashSet::new();
    for _ in 0..6 {
        let result = s.step_minute(&mut rng);
        let kick = result
            .events
            .iter()
            .find(|e| {
                matches!(
                    e.event_type,
                    EventType::ShootoutGoal | EventType::ShootoutMiss
                )
            })
            .unwrap();
        assert!(
            takers.insert((kick.side, kick.player_id.clone())),
            "a player kicked twice before teammates"
        );
    }
}

#[test]
fn phase74_substitutions_are_closed_during_shootout() {
    let mut s = make_live_match(true);
    s.phase = MatchPhase::PenaltyShootout;
    assert!(
        s.apply_command(MatchCommand::Substitute {
            side: Side::Home,
            player_off_id: "home_fwd1".into(),
            player_on_id: "home_sub_fwd1".into()
        })
        .is_err()
    );
    assert_eq!(s.home_subs_made, 0);
}

#[test]
fn phase74_ai_chases_late_deficit_with_tactical_instructions() {
    let mut s = make_live_match(false);
    s.phase = MatchPhase::SecondHalf;
    s.current_minute = 80;
    s.away_score = 1;
    let commands = crate::ai::ai_decide(
        &s,
        Side::Home,
        &crate::ai::AiProfile::default(),
        &mut StdRng::seed_from_u64(74),
    );
    assert!(
        commands
            .iter()
            .any(|c| matches!(c, MatchCommand::ChangeTacticalInstruction { .. }))
    );
}

#[test]
fn phase74_ai_rests_exhausted_press_instead_of_blindly_attacking() {
    let mut s = make_live_match(false);
    s.phase = MatchPhase::SecondHalf;
    s.current_minute = 70;
    s.home.tactics.pressing_intensity = crate::PressingIntensity::Aggressive;
    for condition in s.player_conditions.values_mut() {
        *condition = 35.0;
    }
    let commands = crate::ai::ai_decide(
        &s,
        Side::Home,
        &crate::ai::AiProfile::default(),
        &mut StdRng::seed_from_u64(74),
    );
    assert!(commands.iter().any(|c| matches!(
        c,
        MatchCommand::ChangeTacticalInstruction {
            instruction: crate::types::TacticalInstruction::PressingIntensity(
                crate::PressingIntensity::Passive
            ),
            ..
        }
    )));
}

#[test]
fn phase74_penalty_order_is_validated_atomically() {
    let mut s = make_live_match(true);
    let valid = vec!["home_mid1".to_owned(), "home_fwd1".to_owned()];
    s.apply_command(MatchCommand::SetPenaltyOrder {
        side: Side::Home,
        player_ids: valid.clone(),
    })
    .unwrap();
    for invalid in [
        vec!["home_mid1".into(), "home_mid1".into()],
        vec!["away_mid1".into()],
        vec!["home_sub_fwd1".into()],
    ] {
        assert!(
            s.apply_command(MatchCommand::SetPenaltyOrder {
                side: Side::Home,
                player_ids: invalid
            })
            .is_err()
        );
        assert_eq!(s.home_set_pieces.penalty_order, valid);
    }
    s.phase = MatchPhase::PenaltyShootout;
    s.current_minute = 120;
    let result = s.step_minute(&mut StdRng::seed_from_u64(741));
    assert_eq!(result.events[0].player_id.as_deref(), Some("home_mid1"));
}

#[test]
fn phase74_old_set_pieces_deserialize_with_default_order() {
    let pieces: super::SetPieceTakers = serde_json::from_str(
        r#"{"free_kick_taker":null,"corner_taker":null,"penalty_taker":"legacy","captain":null}"#,
    )
    .unwrap();
    assert!(pieces.penalty_order.is_empty());
    assert_eq!(pieces.penalty_taker.as_deref(), Some("legacy"));
}

#[test]
fn phase74_ai_context_has_cooldown() {
    let mut s = make_live_match(true);
    s.phase = MatchPhase::SecondHalf;
    s.current_minute = 80;
    s.away_score = 1;
    let mut rng = StdRng::seed_from_u64(74);
    let profile = crate::ai::AiProfile::default();
    let commands = crate::ai::ai_decide(&s, Side::Home, &profile, &mut rng);
    for command in commands {
        s.apply_command(command).unwrap();
    }
    let repeated = crate::ai::ai_decide(&s, Side::Home, &profile, &mut rng);
    assert!(
        !repeated
            .iter()
            .any(|c| matches!(c, MatchCommand::ChangeTacticalInstruction { .. }))
    );
}

#[test]
fn phase74_ai_preserves_tired_player_if_reserves_are_worse() {
    let mut s = make_live_match(false);
    s.phase = MatchPhase::SecondHalf;
    s.current_minute = 60;
    s.player_conditions.insert("home_mid1".into(), 40.0);
    for p in &mut s.home_bench {
        p.condition = 10;
    }
    let commands = crate::ai::ai_decide(
        &s,
        Side::Home,
        &crate::ai::AiProfile::default(),
        &mut StdRng::seed_from_u64(74),
    );
    assert!(
        !commands
            .iter()
            .any(|c| matches!(c, MatchCommand::Substitute { .. }))
    );
}

#[test]
fn phase74_ai_uses_fresh_cover_for_booked_defender() {
    let mut s = make_live_match(false);
    s.phase = MatchPhase::SecondHalf;
    s.current_minute = 70;
    s.yellows.insert("home_def1".into(), 1);
    s.player_conditions.insert("home_def1".into(), 65.0);
    let commands = crate::ai::ai_decide(
        &s,
        Side::Home,
        &crate::ai::AiProfile::default(),
        &mut StdRng::seed_from_u64(74),
    );
    assert!(commands.iter().any(|c| matches!(c, MatchCommand::Substitute { player_off_id, .. } if player_off_id == "home_def1")));
}

#[test]
fn phase74_ai_closes_space_after_a_dismissal() {
    let mut s = make_live_match(false);
    s.phase = MatchPhase::FirstHalf;
    s.current_minute = 30;
    s.sent_off.insert("home_mid1".into());
    let commands = crate::ai::ai_decide(
        &s,
        Side::Home,
        &crate::ai::AiProfile::default(),
        &mut StdRng::seed_from_u64(74),
    );
    assert!(commands.iter().any(|c| matches!(
        c,
        MatchCommand::ChangeTacticalInstruction {
            instruction: crate::types::TacticalInstruction::DefensiveShape(
                crate::types::DefensiveShape::Compact
            ),
            ..
        }
    )));
}

#[test]
fn phase74_ai_changes_build_up_against_aggressive_opposition_press() {
    let mut s = make_live_match(false);
    s.phase = MatchPhase::FirstHalf;
    s.current_minute = 30;
    s.away.tactics.pressing_intensity = crate::PressingIntensity::Aggressive;
    for p in &mut s.home.players {
        p.passing = 50;
    }
    let commands = crate::ai::ai_decide(
        &s,
        Side::Home,
        &crate::ai::AiProfile::default(),
        &mut StdRng::seed_from_u64(74),
    );
    assert!(commands.iter().any(|c| matches!(
        c,
        MatchCommand::ChangeTacticalInstruction {
            instruction: crate::types::TacticalInstruction::BuildUpStyle(
                crate::types::TacticsBuildUpStyle::Long
            ),
            ..
        }
    )));
}

#[test]
fn phase74_set_piece_assignment_rejects_ineligible_players_and_clears_auto() {
    let mut s = make_live_match(false);
    assert!(
        s.apply_command(MatchCommand::SetPenaltyTaker {
            side: Side::Home,
            player_id: "away_fwd1".into()
        })
        .is_err()
    );
    s.apply_command(MatchCommand::SetPenaltyTaker {
        side: Side::Home,
        player_id: "home_fwd1".into(),
    })
    .unwrap();
    s.apply_command(MatchCommand::SetPenaltyTaker {
        side: Side::Home,
        player_id: String::new(),
    })
    .unwrap();
    assert!(s.home_set_pieces.penalty_taker.is_none());
}

#[test]
fn phase74_substitution_clears_obsolete_set_piece_assignments() {
    let mut s = make_live_match(false);
    s.phase = MatchPhase::SecondHalf;
    s.home_set_pieces.penalty_taker = Some("home_fwd1".into());
    s.home_set_pieces.penalty_order = vec!["home_fwd1".into(), "home_fwd2".into()];
    s.apply_command(MatchCommand::Substitute {
        side: Side::Home,
        player_off_id: "home_fwd1".into(),
        player_on_id: "home_sub_fwd1".into(),
    })
    .unwrap();
    assert!(s.home_set_pieces.penalty_taker.is_none());
    assert_eq!(s.home_set_pieces.penalty_order, vec!["home_fwd2"]);
}

#[test]
fn phase74_live_ai_seeded_stress() {
    let mut goals = 0u32;
    let mut subs = 0u32;
    let mut tactical_events = 0u32;
    let mut shootouts = 0u32;
    for seed in 7400..7600 {
        let mut s = make_live_match(true);
        let mut rng = StdRng::seed_from_u64(seed);
        let profile = crate::ai::AiProfile::default();
        for _ in 0..1000 {
            if s.is_finished() {
                break;
            }
            s.step_minute(&mut rng);
            for side in [Side::Home, Side::Away] {
                for command in crate::ai::ai_decide(&s, side, &profile, &mut rng) {
                    s.apply_command(command)
                        .expect("AI commands must remain legal");
                }
            }
        }
        assert!(s.is_finished(), "seed {seed} did not complete");
        let snap = s.snapshot();
        assert!(snap.home_subs_made <= snap.max_subs && snap.away_subs_made <= snap.max_subs);
        assert!(snap.home_possession_pct.is_finite());
        goals += snap.home_score as u32 + snap.away_score as u32;
        subs += snap.home_subs_made as u32 + snap.away_subs_made as u32;
        tactical_events += snap
            .events
            .iter()
            .filter(|e| e.event_type == EventType::TacticalChange)
            .count() as u32;
        if snap.penalty_shootout.is_some() {
            shootouts += 1;
        }
        let report = s.into_report();
        assert_eq!(
            (report.home_goals, report.away_goals),
            (snap.home_score, snap.away_score)
        );
        assert!(report.home_stats.expected_goals.is_finite());
    }
    println!(
        "LIVE_AI_BENCH games=200 seed=7400 goals={goals} substitutions={subs} tactical_events={tactical_events} shootouts={shootouts}"
    );
}

#[test]
fn phase74_shootout_reduces_eligible_pools_and_repeats_only_after_a_cycle() {
    let mut s = make_live_match(true);
    s.phase = MatchPhase::PenaltyShootout;
    s.current_minute = 120;
    s.home
        .players
        .retain(|p| ["home_gk", "home_fwd1", "home_fwd2"].contains(&p.id.as_str()));
    s.away
        .players
        .retain(|p| ["away_gk", "away_fwd1"].contains(&p.id.as_str()));
    let mut home = Vec::new();
    let mut away = Vec::new();
    let mut rng = StdRng::seed_from_u64(741);
    for _ in 0..6 {
        for e in s.step_minute(&mut rng).events {
            if matches!(
                e.event_type,
                EventType::ShootoutGoal | EventType::ShootoutMiss
            ) {
                if e.side == Side::Home {
                    home.push(e.player_id.unwrap());
                } else {
                    away.push(e.player_id.unwrap());
                }
            }
        }
    }
    assert_ne!(home[0], home[1]);
    assert_eq!(home[0], home[2]);
    assert_ne!(away[0], away[1]);
    assert_eq!(away[0], away[2]);
}

#[test]
fn phase74_shootout_skips_dismissed_designated_takers() {
    let mut s = make_live_match(true);
    s.phase = MatchPhase::PenaltyShootout;
    s.current_minute = 120;
    s.home_set_pieces.penalty_order = vec!["home_fwd1".into(), "home_fwd2".into()];
    s.sent_off.insert("home_fwd1".into());
    let result = s.step_minute(&mut StdRng::seed_from_u64(741));
    assert_eq!(result.events[0].player_id.as_deref(), Some("home_fwd2"));
}
