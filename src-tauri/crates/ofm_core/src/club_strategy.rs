use domain::team::Team;
use serde::{Deserialize, Serialize};

/// Long-term AI identity derived from a club's existing persistent state.
/// Kept separate from Team so older saves remain compatible while the world
/// simulation learns to make differentiated recruitment and management choices.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum RecruitmentPhilosophy {
    YouthDevelopment,
    Value,
    Balanced,
    WinNow,
    Rebuild,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum StrategicStatus {
    FinancialCrisis,
    Rebuild,
    Stable,
    Growth,
    Contender,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ClubStrategy {
    /// 0-100: willingness to chase sporting progress rather than preserve status quo.
    pub ambition: u8,
    /// 0-100: preference for developing and fielding young players.
    pub youth_priority: u8,
    /// 0-100: willingness to spend close to available budgets.
    pub financial_risk: u8,
    /// 0-100: higher values mean the board gives managers more time.
    pub manager_patience: u8,
    /// Ideal average first-team age used by recruitment scoring.
    pub preferred_squad_age: u8,
    pub recruitment: RecruitmentPhilosophy,
    pub status: StrategicStatus,
}

impl Default for ClubStrategy {
    fn default() -> Self {
        Self {
            ambition: 50,
            youth_priority: 50,
            financial_risk: 45,
            manager_patience: 55,
            preferred_squad_age: 26,
            recruitment: RecruitmentPhilosophy::Balanced,
            status: StrategicStatus::Stable,
        }
    }
}

impl ClubStrategy {
    /// Deterministically derives an initial AI identity from data already stored
    /// on Team. No RNG is used, so loading the same career cannot reshuffle club
    /// behaviour.
    pub fn derive(team: &Team) -> Self {
        let reputation = team.reputation.min(1_000) as i32;
        let training = team.facilities.training.min(10) as i32;
        let scouting = team.facilities.scouting.min(10) as i32;
        let facility_strength = training + scouting;
        let healthy_cash = team.finance > 0;
        // An exhausted transfer allocation is not debt: clubs can keep healthy
        // cash reserves after spending their recruitment budget.
        let stressed = team.finance < 0;

        let ambition = clamp_score(32 + reputation / 17 + facility_strength * 2);
        let youth_priority = clamp_score(38 + training * 5 + scouting * 4 - reputation / 80);
        let financial_risk = if stressed {
            18
        } else {
            clamp_score(32 + reputation / 25 + if healthy_cash { 8 } else { 0 })
        };
        let manager_patience = clamp_score(68 - reputation / 28 + if stressed { 8 } else { 0 });

        let status = if stressed {
            StrategicStatus::FinancialCrisis
        } else if reputation >= 850 {
            StrategicStatus::Contender
        } else if reputation >= 650 && team.transfer_budget > 2_000_000 {
            StrategicStatus::Growth
        } else if reputation < 350 {
            StrategicStatus::Rebuild
        } else {
            StrategicStatus::Stable
        };

        let recruitment = match status {
            StrategicStatus::FinancialCrisis => RecruitmentPhilosophy::Value,
            StrategicStatus::Rebuild if youth_priority >= 55 => {
                RecruitmentPhilosophy::YouthDevelopment
            }
            StrategicStatus::Rebuild => RecruitmentPhilosophy::Rebuild,
            StrategicStatus::Contender if ambition >= 75 => RecruitmentPhilosophy::WinNow,
            _ if youth_priority >= 65 => RecruitmentPhilosophy::YouthDevelopment,
            _ => RecruitmentPhilosophy::Balanced,
        };

        let preferred_squad_age = match recruitment {
            RecruitmentPhilosophy::YouthDevelopment => 23,
            RecruitmentPhilosophy::Rebuild => 24,
            RecruitmentPhilosophy::Value => 25,
            RecruitmentPhilosophy::Balanced => 26,
            RecruitmentPhilosophy::WinNow => 27,
        };

        Self {
            ambition,
            youth_priority,
            financial_risk,
            manager_patience,
            preferred_squad_age,
            recruitment,
            status,
        }
    }

    /// Maximum fraction of the available transfer budget that AI bidding should
    /// normally commit to a single target before exceptional-player logic applies.
    pub fn single_deal_budget_fraction(&self) -> f32 {
        match self.financial_risk {
            0..=24 => 0.22,
            25..=44 => 0.32,
            45..=64 => 0.42,
            65..=84 => 0.55,
            _ => 0.68,
        }
    }

    /// Recruitment preference modifier. Positive values make the player a more
    /// attractive target; negative values discourage the move.
    pub fn age_preference_score(&self, age: u8) -> i16 {
        let distance = (age as i16 - self.preferred_squad_age as i16).abs();
        let base = 14 - distance * 3;
        match self.recruitment {
            RecruitmentPhilosophy::YouthDevelopment if age <= 21 => base + 18,
            RecruitmentPhilosophy::Rebuild if age <= 24 => base + 10,
            RecruitmentPhilosophy::WinNow if (24..=29).contains(&age) => base + 12,
            RecruitmentPhilosophy::Value if age <= 26 => base + 6,
            _ => base,
        }
    }

    /// Re-evaluates the strategy after a season while retaining inertia. This
    /// prevents clubs from completely changing identity after one unusual year.
    pub fn evolve_after_season(&mut self, team: &Team, league_position: u32, league_size: u32) {
        let derived = Self::derive(team);
        self.ambition = blend(self.ambition, derived.ambition, 3);
        self.youth_priority = blend(self.youth_priority, derived.youth_priority, 4);
        self.financial_risk = blend(self.financial_risk, derived.financial_risk, 2);
        self.manager_patience = blend(self.manager_patience, derived.manager_patience, 3);

        let valid_finish = (1..=league_size).contains(&league_position);
        let top_quarter = (league_size / 4).max(1);
        let bottom_quarter = league_size.saturating_sub(top_quarter);
        let poor_finish =
            valid_finish && league_position > top_quarter && league_position > bottom_quarter;
        if valid_finish {
            if league_position <= top_quarter {
                self.ambition = self.ambition.saturating_add(5).min(100);
            } else if league_position > bottom_quarter {
                self.manager_patience = self.manager_patience.saturating_sub(6);
                if self.status != StrategicStatus::FinancialCrisis {
                    self.status = StrategicStatus::Rebuild;
                    self.recruitment = RecruitmentPhilosophy::Rebuild;
                    self.preferred_squad_age = 24;
                }
            }
        }

        if derived.status == StrategicStatus::FinancialCrisis {
            self.status = StrategicStatus::FinancialCrisis;
            self.recruitment = RecruitmentPhilosophy::Value;
            self.financial_risk = self.financial_risk.min(20);
            self.preferred_squad_age = 25;
        } else if self.status != StrategicStatus::Rebuild || (valid_finish && !poor_finish) {
            self.status = derived.status;
            self.recruitment = derived.recruitment;
            self.preferred_squad_age = derived.preferred_squad_age;
        }
    }
}

/// Saved strategic identity and the last completed season already reviewed.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct CareerStrategy {
    pub strategy: ClubStrategy,
    pub reviewed_season: u32,
}

/// Use the learned career strategy, while responding immediately to a cash crisis.
pub fn for_team(game: &crate::game::Game, team: &Team) -> ClubStrategy {
    let current = ClubStrategy::derive(team);
    match game.club_strategies.get(&team.id) {
        Some(saved)
            if current.status != StrategicStatus::FinancialCrisis
                && saved.strategy.status != StrategicStatus::FinancialCrisis =>
        {
            saved.strategy.clone()
        }
        _ => current,
    }
}

/// Called with the final domestic division table before it is regenerated.
/// A duplicate rollover or an older table must not review the same year again.
pub fn review_team(
    game: &mut crate::game::Game,
    team_id: &str,
    position: u32,
    size: u32,
    season: u32,
) {
    if !(1..=size).contains(&position) {
        return;
    }
    let Some(team) = game.teams.iter().find(|team| team.id == team_id) else {
        return;
    };
    let saved = game
        .club_strategies
        .entry(team_id.to_string())
        .or_insert_with(|| CareerStrategy {
            strategy: ClubStrategy::derive(team),
            reviewed_season: 0,
        });
    if season <= saved.reviewed_season {
        return;
    }
    saved.strategy.evolve_after_season(team, position, size);
    saved.reviewed_season = season;
}

fn clamp_score(value: i32) -> u8 {
    value.clamp(0, 100) as u8
}

fn blend(current: u8, target: u8, inertia: u16) -> u8 {
    (((current as u16 * inertia) + target as u16) / (inertia + 1)) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    fn club(reputation: u32, finance: i64, transfer_budget: i64) -> Team {
        let mut team = Team::new(
            "strategy-test".into(),
            "Strategy FC".into(),
            "SFC".into(),
            "England".into(),
            "Test".into(),
            "Test Ground".into(),
            20_000,
        );
        team.reputation = reputation;
        team.finance = finance;
        team.transfer_budget = transfer_budget;
        team
    }

    #[test]
    fn elite_healthy_club_is_more_ambitious_than_small_club() {
        let elite = ClubStrategy::derive(&club(900, 100_000_000, 40_000_000));
        let small = ClubStrategy::derive(&club(250, 1_000_000, 300_000));
        assert!(elite.ambition > small.ambition);
        assert_eq!(elite.status, StrategicStatus::Contender);
    }

    #[test]
    fn distressed_club_becomes_value_focused_and_conservative() {
        let strategy = ClubStrategy::derive(&club(700, -2_000_000, 0));
        assert_eq!(strategy.status, StrategicStatus::FinancialCrisis);
        assert_eq!(strategy.recruitment, RecruitmentPhilosophy::Value);
        assert!(strategy.financial_risk <= 20);
    }

    #[test]
    fn spent_transfer_budget_does_not_make_a_cash_rich_club_insolvent() {
        let strategy = ClubStrategy::derive(&club(900, 100_000_000, 0));
        assert_eq!(strategy.status, StrategicStatus::Contender);
        assert_ne!(strategy.recruitment, RecruitmentPhilosophy::Value);
    }

    #[test]
    fn zero_cash_without_debt_is_not_a_financial_crisis() {
        let strategy = ClubStrategy::derive(&club(500, 0, 0));
        assert_eq!(strategy.status, StrategicStatus::Stable);
    }

    #[test]
    fn debt_still_requires_caution_even_with_an_allocated_transfer_budget() {
        let strategy = ClubStrategy::derive(&club(900, -1, 40_000_000));
        assert_eq!(strategy.status, StrategicStatus::FinancialCrisis);
        assert_eq!(strategy.recruitment, RecruitmentPhilosophy::Value);
    }

    #[test]
    fn imported_training_level_cannot_exceed_the_best_facility() {
        let mut team = club(400, 1_000_000, 300_000);
        team.facilities.training = 10;
        let maximum = ClubStrategy::derive(&team);
        team.facilities.training = u8::MAX;
        assert_eq!(ClubStrategy::derive(&team), maximum);
    }

    #[test]
    fn imported_scouting_level_cannot_exceed_the_best_facility() {
        let mut team = club(400, 1_000_000, 300_000);
        team.facilities.scouting = 10;
        let maximum = ClubStrategy::derive(&team);
        team.facilities.scouting = u8::MAX;
        assert_eq!(ClubStrategy::derive(&team), maximum);
    }

    #[test]
    fn youth_strategy_rewards_young_targets() {
        let strategy = ClubStrategy {
            recruitment: RecruitmentPhilosophy::YouthDevelopment,
            preferred_squad_age: 23,
            ..ClubStrategy::default()
        };
        assert!(strategy.age_preference_score(19) > strategy.age_preference_score(31));
    }

    #[test]
    fn poor_finish_moves_non_crisis_club_toward_rebuild() {
        let team = club(600, 10_000_000, 4_000_000);
        let mut strategy = ClubStrategy::derive(&team);
        strategy.evolve_after_season(&team, 19, 20);
        assert_eq!(strategy.status, StrategicStatus::Rebuild);
        assert_eq!(strategy.recruitment, RecruitmentPhilosophy::Rebuild);
    }

    #[test]
    fn absent_league_position_does_not_count_as_a_championship() {
        let team = club(500, 1_000_000, 300_000);
        let mut absent = ClubStrategy::derive(&team);
        let mut without_table = absent.clone();
        absent.evolve_after_season(&team, 0, 20);
        without_table.evolve_after_season(&team, 0, 0);
        assert_eq!(absent, without_table);
    }

    #[test]
    fn out_of_range_league_position_does_not_force_a_rebuild() {
        let team = club(500, 1_000_000, 300_000);
        let mut invalid = ClubStrategy::derive(&team);
        let mut without_table = invalid.clone();
        invalid.evolve_after_season(&team, 21, 20);
        without_table.evolve_after_season(&team, 0, 0);
        assert_eq!(invalid, without_table);
    }

    #[test]
    fn rebuilding_club_recovers_its_identity_after_a_successful_season() {
        let team = club(700, 10_000_000, 4_000_000);
        let mut strategy = ClubStrategy::derive(&team);
        strategy.evolve_after_season(&team, 19, 20);
        assert_eq!(strategy.status, StrategicStatus::Rebuild);
        strategy.evolve_after_season(&team, 4, 20);
        assert_eq!(strategy.status, StrategicStatus::Growth);
        assert_eq!(
            strategy.recruitment,
            ClubStrategy::derive(&team).recruitment
        );
    }

    #[test]
    fn midtable_recovery_ends_a_results_driven_rebuild() {
        let team = club(500, 10_000_000, 4_000_000);
        let mut strategy = ClubStrategy::derive(&team);
        strategy.evolve_after_season(&team, 20, 20);
        strategy.evolve_after_season(&team, 10, 20);
        assert_eq!(strategy.status, StrategicStatus::Stable);
    }

    #[test]
    fn missing_results_do_not_prematurely_end_a_rebuild() {
        let team = club(500, 10_000_000, 4_000_000);
        let mut strategy = ClubStrategy::derive(&team);
        strategy.evolve_after_season(&team, 20, 20);
        strategy.evolve_after_season(&team, 0, 20);
        assert_eq!(strategy.status, StrategicStatus::Rebuild);
    }
}

#[cfg(test)]
mod career_tests {
    use super::*;
    use crate::{clock::GameClock, game::Game};
    use chrono::{TimeZone, Utc};
    use domain::manager::Manager;

    fn career() -> Game {
        let mut team = Team::new(
            "club".into(),
            "Club".into(),
            "CLB".into(),
            "England".into(),
            "City".into(),
            "Ground".into(),
            20_000,
        );
        team.reputation = 700;
        team.finance = 10_000_000;
        team.transfer_budget = 4_000_000;
        Game::new(
            GameClock::new(Utc.with_ymd_and_hms(2026, 7, 1, 0, 0, 0).unwrap()),
            Manager::new(
                "mgr".into(),
                "Alex".into(),
                "Boss".into(),
                "1980-01-01".into(),
                "England".into(),
            ),
            vec![team],
            vec![],
            vec![],
            vec![],
        )
    }

    #[test]
    fn seasonal_rebuild_is_used_by_live_recruitment() {
        let mut game = career();
        review_team(&mut game, "club", 20, 20, 2026);
        assert_eq!(
            for_team(&game, &game.teams[0]).status,
            StrategicStatus::Rebuild
        );
        assert_eq!(
            for_team(&game, &game.teams[0]).recruitment,
            RecruitmentPhilosophy::Rebuild
        );
    }

    #[test]
    fn repeated_review_does_not_change_strategy_twice() {
        let mut game = career();
        review_team(&mut game, "club", 20, 20, 2026);
        let before = serde_json::to_value(&game.club_strategies).unwrap();
        review_team(&mut game, "club", 1, 20, 2026);
        assert_eq!(before, serde_json::to_value(&game.club_strategies).unwrap());
    }

    #[test]
    fn next_season_can_recover_a_rebuild_and_debt_takes_immediate_priority() {
        let mut game = career();
        review_team(&mut game, "club", 20, 20, 2026);
        review_team(&mut game, "club", 4, 20, 2027);
        assert_eq!(
            for_team(&game, &game.teams[0]).status,
            StrategicStatus::Growth
        );
        game.teams[0].finance = -1;
        assert_eq!(
            for_team(&game, &game.teams[0]).status,
            StrategicStatus::FinancialCrisis
        );
    }

    #[test]
    fn invalid_results_do_not_consume_a_season_review() {
        let mut game = career();
        review_team(&mut game, "club", 0, 20, 2026);
        assert!(game.club_strategies.is_empty());
        review_team(&mut game, "club", 20, 20, 2026);
        assert_eq!(
            for_team(&game, &game.teams[0]).status,
            StrategicStatus::Rebuild
        );
    }

    #[test]
    fn legacy_json_without_strategy_state_still_loads() {
        let game = career();
        let mut json = serde_json::to_value(game).unwrap();
        json.as_object_mut().unwrap().remove("club_strategies");
        let loaded: Game = serde_json::from_value(json).unwrap();
        assert!(loaded.club_strategies.is_empty());
        assert_eq!(
            for_team(&loaded, &loaded.teams[0]),
            ClubStrategy::derive(&loaded.teams[0])
        );
    }
}
