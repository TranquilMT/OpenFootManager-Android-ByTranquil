use ofm_domain::team::Team;
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
        let facility_strength =
            team.facilities.training as i32 + team.facilities.scouting as i32;
        let healthy_cash = team.finance > 0;
        let stressed = team.finance < 0 || team.transfer_budget <= 0;

        let ambition = clamp_score(32 + reputation / 17 + facility_strength * 2);
        let youth_priority = clamp_score(
            38 + team.facilities.training as i32 * 5 + team.facilities.scouting as i32 * 4
                - reputation / 80,
        );
        let financial_risk = if stressed {
            18
        } else {
            clamp_score(32 + reputation / 25 + if healthy_cash { 8 } else { 0 })
        };
        let manager_patience = clamp_score(
            68 - reputation / 28 + if stressed { 8 } else { 0 },
        );

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

        if league_size > 0 {
            let top_quarter = (league_size / 4).max(1);
            let bottom_quarter = league_size.saturating_sub(top_quarter);
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
        } else if self.status != StrategicStatus::Rebuild {
            self.status = derived.status;
            self.recruitment = derived.recruitment;
            self.preferred_squad_age = derived.preferred_squad_age;
        }
    }
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
}
