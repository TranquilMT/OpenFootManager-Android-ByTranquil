use rand::Rng;

use crate::event::{DangerBand, FoulSeverity, GoalContext};
use crate::shared::{
    PlayStylePhase, PlayerSnap, home_mod, play_style_modifier, tactics_pressing_fatigue,
    tactics_pressing_press,
};
use crate::types::{PlayerData, Position, Side, TeamData};

use super::{LiveMatchState, SetPieceTakers};

// ---------------------------------------------------------------------------
// Stamina system
// ---------------------------------------------------------------------------

impl LiveMatchState {
    pub(super) fn deplete_stamina_tick(&mut self) {
        let base_rate = self.config.fatigue_per_minute;
        // Aggressive pressing tires a side faster; neutral (Medium) is ×1.0.
        let home_rate = base_rate * tactics_pressing_fatigue(&self.home.tactics);
        let away_rate = base_rate * tactics_pressing_fatigue(&self.away.tactics);
        // Iterate over all on-pitch players, each with their team's fatigue rate.
        let players = self
            .home
            .players
            .iter()
            .map(|p| (p, home_rate))
            .chain(self.away.players.iter().map(|p| (p, away_rate)));
        for (p, fatigue_rate) in players {
            if self.sent_off.contains(&p.id) {
                continue;
            }
            let stamina_factor = p.stamina as f64 / 100.0;
            let fitness_factor = p.fitness as f64 / 100.0;
            // Higher stamina → less depletion; higher fitness → less depletion.
            // Fitness scales the base depletion more aggressively (unfit players tire much faster).
            let depletion =
                fatigue_rate * (1.0 - stamina_factor * 0.5) * (1.3 - fitness_factor * 0.6);
            if let Some(cond) = self.player_conditions.get_mut(&p.id) {
                *cond = (*cond - depletion).max(5.0);
            }
        }
    }

    /// Adjust a skill value based on the player's current in-match condition.
    pub(super) fn condition_adjusted_skill(&self, player_id: &str, base_skill: f64) -> f64 {
        let condition = self
            .player_conditions
            .get(player_id)
            .copied()
            .unwrap_or(50.0);
        // At 100% condition: full skill. At 50%: ~80% skill. At 0%: ~60% skill.
        let condition = if condition.is_finite() { condition.clamp(0.0, 100.0) } else { 50.0 };
        let factor = 0.6 + 0.4 * (condition / 100.0);
        base_skill * factor
    }

    // -----------------------------------------------------------------------
    // Player selection helpers
    // -----------------------------------------------------------------------

    pub(super) fn snap_player<R: Rng>(
        &self,
        side: Side,
        preferred: Position,
        rng: &mut R,
    ) -> PlayerSnap {
        let team = self.team_ref(side);
        crate::shared::snap_from_squad(&team.players, &self.sent_off, preferred, rng)
            .unwrap_or_else(PlayerSnap::nobody)
    }

    pub(super) fn pick_penalty_taker<R: Rng>(&self, side: Side, rng: &mut R) -> PlayerSnap {
        // Use designated taker if set
        if let Some(ref id) = self.set_pieces_ref(side).penalty_taker {
            let team = self.team_ref(side);
            if let Some(p) = team
                .players
                .iter()
                .find(|p| p.id == *id && !self.sent_off.contains(&p.id))
            {
                return PlayerSnap::from(p);
            }
        }
        // Fallback: pick the forward with highest shooting
        let team = self.team_ref(side);
        let mut candidates: Vec<&PlayerData> = team
            .players
            .iter()
            .filter(|p| !self.sent_off.contains(&p.id))
            .collect();
        candidates.sort_by_key(|p| std::cmp::Reverse(p.shooting));
        if let Some(p) = candidates.first() {
            PlayerSnap::from(p)
        } else {
            self.snap_player(side, Position::Forward, rng)
        }
    }

    pub(super) fn pick_goalkeeper(&self, side: Side) -> PlayerSnap {
        self.team_ref(side)
            .players
            .iter()
            .filter(|p| !self.sent_off.contains(&p.id))
            .max_by(|a, b| {
                a.position
                    .eq(&Position::Goalkeeper)
                    .cmp(&b.position.eq(&Position::Goalkeeper))
                    .then_with(|| {
                        self.condition_adjusted_skill(
                            &a.id,
                            (a.handling as f64 + a.reflexes as f64 + a.positioning as f64) / 3.0,
                        )
                        .total_cmp(&self.condition_adjusted_skill(
                            &b.id,
                            (b.handling as f64 + b.reflexes as f64 + b.positioning as f64) / 3.0,
                        ))
                    })
            })
            .map(PlayerSnap::from)
            .unwrap_or_else(PlayerSnap::nobody)
    }

    // -----------------------------------------------------------------------
    // Rating helpers
    // -----------------------------------------------------------------------

    pub(super) fn effective_midfield(&self, side: Side) -> f64 {
        let base = crate::shared::active_position_rating(
            &self.team_ref(side).players,
            &self.sent_off,
            Position::Midfielder,
            |p| (p.passing as f64 + p.vision as f64 + p.decisions as f64 + p.stamina as f64) / 4.0,
            |p| self.condition_adjusted_skill(&p.id, 1.0),
        );
        let modifier = play_style_modifier(
            self.team_ref(side).play_style,
            PlayStylePhase::Midfield,
            true,
        );
        base * modifier * home_mod(side, &self.config)
    }

    pub(super) fn effective_press(&self, pressing_side: Side) -> f64 {
        let team = self.team_ref(pressing_side);
        let base = crate::shared::active_position_rating(
            &team.players,
            &self.sent_off,
            Position::Midfielder,
            |p| (p.stamina as f64 + p.tackling as f64 + p.pace as f64) / 3.0,
            |p| self.condition_adjusted_skill(&p.id, 1.0),
        );
        let modifier = play_style_modifier(team.play_style, PlayStylePhase::Press, true);
        base * modifier
            * tactics_pressing_press(&team.tactics)
            * home_mod(pressing_side, &self.config)
    }

    // -----------------------------------------------------------------------
    // Internal accessors
    // -----------------------------------------------------------------------

    pub(super) fn team_ref(&self, side: Side) -> &TeamData {
        match side {
            Side::Home => &self.home,
            Side::Away => &self.away,
        }
    }

    pub(super) fn team_mut(&mut self, side: Side) -> &mut TeamData {
        match side {
            Side::Home => &mut self.home,
            Side::Away => &mut self.away,
        }
    }

    pub(super) fn set_pieces_ref(&self, side: Side) -> &SetPieceTakers {
        match side {
            Side::Home => &self.home_set_pieces,
            Side::Away => &self.away_set_pieces,
        }
    }

    pub(super) fn set_pieces_mut(&mut self, side: Side) -> &mut SetPieceTakers {
        match side {
            Side::Home => &mut self.home_set_pieces,
            Side::Away => &mut self.away_set_pieces,
        }
    }

    /// Classify a goal about to be scored by `side`, using the CURRENT (pre-increment) score.
    pub(super) fn goal_context(&self, side: Side) -> GoalContext {
        let (own, opp) = match side {
            Side::Home => (self.home_score, self.away_score),
            Side::Away => (self.away_score, self.home_score),
        };
        let own_new = own + 1;
        if own == 0 && opp == 0 {
            GoalContext::Opener
        } else if own_new == opp {
            GoalContext::Equaliser
        } else if own_new > opp {
            GoalContext::Extends
        } else {
            GoalContext::Consolation
        }
    }

    pub(super) fn add_goal(&mut self, side: Side) {
        match side {
            Side::Home => self.home_score += 1,
            Side::Away => self.away_score += 1,
        }
    }
}

/// Map a shooter's effective rating to a danger band for shot commentary.
pub(super) fn danger_band(shoot_rating: f64) -> DangerBand {
    if shoot_rating >= 68.0 {
        DangerBand::BigChance
    } else if shoot_rating >= 50.0 {
        DangerBand::Decent
    } else {
        DangerBand::Speculative
    }
}

/// Map a fouler's aggression (0-100) to a foul-severity band.
pub(super) fn foul_severity(aggression: u8) -> FoulSeverity {
    if aggression >= 70 {
        FoulSeverity::Reckless
    } else if aggression >= 40 {
        FoulSeverity::Hard
    } else {
        FoulSeverity::Soft
    }
}

#[cfg(test)]
mod commentary_detail_tests {
    use super::*;
    use crate::event::GoalContext;

    #[test]
    fn danger_band_thresholds() {
        assert_eq!(danger_band(40.0), DangerBand::Speculative);
        assert_eq!(danger_band(49.9), DangerBand::Speculative);
        assert_eq!(danger_band(50.0), DangerBand::Decent);
        assert_eq!(danger_band(55.0), DangerBand::Decent);
        assert_eq!(danger_band(67.9), DangerBand::Decent);
        assert_eq!(danger_band(68.0), DangerBand::BigChance);
        assert_eq!(danger_band(75.0), DangerBand::BigChance);
    }

    #[test]
    fn foul_severity_thresholds() {
        assert_eq!(foul_severity(20), FoulSeverity::Soft);
        assert_eq!(foul_severity(39), FoulSeverity::Soft);
        assert_eq!(foul_severity(40), FoulSeverity::Hard);
        assert_eq!(foul_severity(55), FoulSeverity::Hard);
        assert_eq!(foul_severity(69), FoulSeverity::Hard);
        assert_eq!(foul_severity(70), FoulSeverity::Reckless);
        assert_eq!(foul_severity(85), FoulSeverity::Reckless);
    }

    #[test]
    fn dismissed_midfielders_stop_influencing_possession() {
        let home = crate::types::TeamData {
            id: "h".into(),
            name: "H".into(),
            formation: "4-4-2".into(),
            play_style: crate::types::PlayStyle::Balanced,
            players: vec![make_test_player("mid", Position::Midfielder)],
            tactics: crate::types::TacticsConfig::default(),
        };
        let mut state = LiveMatchState::new(
            home.clone(),
            home,
            crate::types::MatchConfig::default(),
            vec![],
            vec![],
            false,
        );
        let before = state.effective_midfield(Side::Home);
        state.sent_off.insert("mid".into());
        assert!(state.effective_midfield(Side::Home) < before);
    }

    #[test]
    fn tired_midfielders_cannot_press_at_full_strength() {
        let home = crate::types::TeamData {
            id: "h".into(),
            name: "H".into(),
            formation: "4-4-2".into(),
            play_style: crate::types::PlayStyle::Balanced,
            players: vec![make_test_player("mid", Position::Midfielder)],
            tactics: crate::types::TacticsConfig::default(),
        };
        let mut state = LiveMatchState::new(
            home.clone(),
            home,
            crate::types::MatchConfig::default(),
            vec![],
            vec![],
            false,
        );
        let before = state.effective_press(Side::Home);
        state.player_conditions.insert("mid".into(), 20.0);
        assert!(state.effective_press(Side::Home) < before);
    }

    #[test]
    fn missing_position_fallback_tracks_available_players() {
        let players = vec![make_test_player("p", Position::Defender)];
        let mut unavailable = std::collections::HashSet::new();
        unavailable.insert("p".to_string());
        assert_eq!(
            crate::shared::active_position_rating(
                &players,
                &unavailable,
                Position::Midfielder,
                |p| p.passing as f64,
                |_| 1.0
            ),
            0.0
        );
    }

    #[test]
    fn dismissals_reduce_a_unit_instead_of_boosting_its_average() {
        let mut weak = make_test_player("weak", Position::Midfielder);
        weak.passing = 20;
        let mut strong = make_test_player("strong", Position::Midfielder);
        strong.passing = 90;
        let players = vec![weak, strong];
        let mut unavailable = std::collections::HashSet::new();
        let before = crate::shared::active_position_rating(
            &players,
            &unavailable,
            Position::Midfielder,
            |p| p.passing as f64,
            |_| 1.0,
        );
        unavailable.insert("weak".to_string());
        assert!(
            crate::shared::active_position_rating(
                &players,
                &unavailable,
                Position::Midfielder,
                |p| p.passing as f64,
                |_| 1.0
            ) < before
        );
    }

    #[test]
    fn designated_penalty_taker_cannot_play_after_dismissal() {
        let mut s = make_test_state();
        s.set_pieces_mut(Side::Home).penalty_taker = Some("home_f1".into());
        s.sent_off.insert("home_f1".into());
        let events = s.resolve_in_match_penalty(10, Side::Home, &mut rand::rng());
        assert!(
            events
                .iter()
                .filter(|e| e.shot.is_some())
                .all(|e| e.player_id.as_deref() != Some("home_f1"))
        );
    }

    #[test]
    fn emergency_keeper_uses_the_best_available_handling() {
        let mut s = make_test_state();
        s.sent_off.insert("home_gk".into());
        let best = s
            .home
            .players
            .iter_mut()
            .find(|p| p.id == "home_d4")
            .unwrap();
        best.handling = 99;
        best.reflexes = 99;
        best.positioning = 99;
        assert_eq!(s.pick_goalkeeper(Side::Home).id, "home_d4");
    }

    #[test]
    fn dismissed_players_cannot_receive_duplicate_red_cards() {
        let mut s = make_test_state();
        s.config.yellow_card_probability = 1.0;
        s.config.red_card_probability = 1.0;
        let mut rng = rand::rng();
        s.maybe_card(
            10,
            Side::Home,
            "home_m1",
            crate::types::Zone::Midfield,
            &mut rng,
        );
        s.maybe_card(
            11,
            Side::Home,
            "home_m1",
            crate::types::Zone::Midfield,
            &mut rng,
        );
        assert_eq!(
            s.events
                .iter()
                .filter(|e| e.event_type == crate::event::EventType::RedCard)
                .count(),
            1
        );
    }

    #[test]
    fn dismissed_bench_player_cannot_enter_or_consume_a_substitution() {
        let mut s = make_test_state();
        s.home_bench.push(make_test_player("reserve", Position::Forward));
        s.sent_off.insert("reserve".into());
        let before = s.home.players.clone();
        assert!(s.do_substitution(Side::Home, "home_f1", "reserve").is_err());
        assert_eq!(s.home_subs_made, 0);
        assert_eq!(s.home.players.len(), before.len());
        assert!(s.home.players.iter().any(|p| p.id == "home_f1"));
        assert_eq!(s.home_bench[0].id, "reserve");
        assert!(s.substitutions.is_empty());
        assert!(s.events.is_empty());
    }

    #[test]
    fn imported_condition_cannot_boost_or_poison_match_skills() {
        let mut s = make_test_state();
        for condition in [150.0, f64::INFINITY, f64::NAN, -50.0] {
            s.player_conditions.insert("home_f1".into(), condition);
            let skill = s.condition_adjusted_skill("home_f1", 80.0);
            assert!(skill.is_finite());
            assert!((48.0..=80.0).contains(&skill));
        }
    }

    #[test]
    fn fallback_penalty_taker_accounts_for_composure_and_fatigue() {
        let mut s = make_test_state();
        for p in &mut s.home.players { p.shooting = 30; p.composure = 30; }
        let tired = s.home.players.iter_mut().find(|p| p.id == "home_f1").unwrap();
        tired.shooting = 99; tired.composure = 20;
        let fresh = s.home.players.iter_mut().find(|p| p.id == "home_m1").unwrap();
        fresh.shooting = 80; fresh.composure = 90;
        s.player_conditions.insert("home_f1".into(), 10.0);
        s.player_conditions.insert("home_m1".into(), 100.0);
        assert_eq!(s.pick_penalty_taker(Side::Home, &mut rand::rng()).id, "home_m1");
        s.set_pieces_mut(Side::Home).penalty_taker = Some("home_f1".into());
        assert_eq!(s.pick_penalty_taker(Side::Home, &mut rand::rng()).id, "home_f1");
    }

    fn make_test_player(id: &str, pos: crate::types::Position) -> crate::types::PlayerData {
        crate::types::PlayerData {
            id: id.to_string(),
            name: id.to_string(),
            position: pos,
            ovr: 70,
            condition: 90,
            fitness: 75,
            pace: 70,
            stamina: 70,
            strength: 70,
            agility: 70,
            passing: 70,
            shooting: 70,
            tackling: 70,
            dribbling: 70,
            defending: 70,
            positioning: 70,
            vision: 70,
            decisions: 70,
            composure: 70,
            aggression: 70,
            teamwork: 70,
            leadership: 70,
            handling: 70,
            reflexes: 70,
            aerial: 70,
            traits: vec![],
            role: crate::types::PlayerRole::Standard,
        }
    }

    fn make_test_state() -> LiveMatchState {
        use crate::types::{MatchConfig, PlayStyle, Position, TeamData};
        let make_team = |id: &str| TeamData {
            id: id.to_string(),
            name: id.to_string(),
            formation: "4-4-2".to_string(),
            play_style: PlayStyle::Balanced,
            players: vec![
                make_test_player(&format!("{}_gk", id), Position::Goalkeeper),
                make_test_player(&format!("{}_d1", id), Position::Defender),
                make_test_player(&format!("{}_d2", id), Position::Defender),
                make_test_player(&format!("{}_d3", id), Position::Defender),
                make_test_player(&format!("{}_d4", id), Position::Defender),
                make_test_player(&format!("{}_m1", id), Position::Midfielder),
                make_test_player(&format!("{}_m2", id), Position::Midfielder),
                make_test_player(&format!("{}_m3", id), Position::Midfielder),
                make_test_player(&format!("{}_m4", id), Position::Midfielder),
                make_test_player(&format!("{}_f1", id), Position::Forward),
                make_test_player(&format!("{}_f2", id), Position::Forward),
            ],
            tactics: crate::types::TacticsConfig::default(),
        };
        LiveMatchState::new(
            make_team("home"),
            make_team("away"),
            MatchConfig::default(),
            vec![],
            vec![],
            false,
        )
    }

    #[test]
    fn goal_context_classifies_correctly() {
        let mut state = make_test_state();
        // 0-0, Home about to score -> Opener
        state.home_score = 0;
        state.away_score = 0;
        assert_eq!(state.goal_context(Side::Home), GoalContext::Opener);
        // 0-1, Home about to score -> Equaliser (0+1 == 1)
        state.home_score = 0;
        state.away_score = 1;
        assert_eq!(state.goal_context(Side::Home), GoalContext::Equaliser);
        // 1-0, Home about to score -> Extends (1+1 > 0)
        state.home_score = 1;
        state.away_score = 0;
        assert_eq!(state.goal_context(Side::Home), GoalContext::Extends);
        // 0-2, Home about to score -> Consolation (0+1 < 2)
        state.home_score = 0;
        state.away_score = 2;
        assert_eq!(state.goal_context(Side::Home), GoalContext::Consolation);
        // Away-side flip: 1-0, Away about to score -> Equaliser
        state.home_score = 1;
        state.away_score = 0;
        assert_eq!(state.goal_context(Side::Away), GoalContext::Equaliser);
    }

    /// Once any goal has been scored — including a penalty, which reaches the
    /// scoreboard through `add_goal` exactly like an open-play goal — no later
    /// goal can be an `Opener`. This pins the cross-path invariant that
    /// `first_goal_detail_is_opener` depends on: that test deliberately skips
    /// seeds where a `PenaltyGoal` scores first, so the penalty-before-goal
    /// case is verified here instead.
    #[test]
    fn goal_after_a_prior_goal_is_never_opener() {
        let mut state = make_test_state();
        // Simulate a converted penalty for the home side via the real scoring API.
        state.add_goal(Side::Home);
        assert_eq!(state.home_score, 1);

        // The scoreboard has moved, so neither side's next goal opens the scoring.
        assert_ne!(state.goal_context(Side::Home), GoalContext::Opener);
        assert_ne!(state.goal_context(Side::Away), GoalContext::Opener);
        // Specifically: home extends the lead, away equalises.
        assert_eq!(state.goal_context(Side::Home), GoalContext::Extends);
        assert_eq!(state.goal_context(Side::Away), GoalContext::Equaliser);
    }
}

#[cfg(test)]
mod empty_squad_tests {
    use crate::live_match::LiveMatchState;
    use crate::types::{MatchConfig, PlayStyle, Side, TacticsConfig, TeamData};

    fn empty_team(id: &str) -> TeamData {
        TeamData {
            id: id.to_string(),
            name: id.to_string(),
            formation: "4-4-2".to_string(),
            play_style: PlayStyle::Balanced,
            tactics: TacticsConfig::default(),
            players: vec![],
        }
    }

    /// The batch engine refuses a match with an empty side, but the live,
    /// spectator and delegated paths build `LiveMatchState` directly and never
    /// reach that guard. Goalkeeper selection ended by indexing `players[0]`,
    /// so a shootout with an empty XI panicked out of the Tauri command and
    /// left the window with no response.
    #[test]
    fn picking_a_goalkeeper_from_nobody_does_not_panic() {
        let state = LiveMatchState::new(
            empty_team("home"),
            empty_team("away"),
            MatchConfig::default(),
            vec![],
            vec![],
            true,
        );

        let keeper = state.pick_goalkeeper(Side::Home);

        assert!(keeper.id.is_empty(), "nobody is available to keep goal");
    }
}
