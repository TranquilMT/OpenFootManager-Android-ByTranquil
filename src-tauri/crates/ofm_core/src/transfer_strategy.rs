use crate::club_strategy::{ClubStrategy, RecruitmentPhilosophy};

/// Buyer-specific inputs used to rank a globally attractive transfer target.
#[derive(Debug, Clone, Copy)]
pub struct StrategicTarget {
    pub base_score: i32,
    pub age: u8,
    pub overall: u8,
    pub potential: u8,
    pub fee: u64,
}

/// Re-ranks a target for a specific club without weakening the market's existing
/// eligibility, reputation, squad-depth or player-openness checks.
pub fn strategic_target_score(
    strategy: &ClubStrategy,
    target: StrategicTarget,
    transfer_budget: i64,
) -> i32 {
    let mut score = target.base_score + i32::from(strategy.age_preference_score(target.age));
    let growth_room = target.potential.saturating_sub(target.overall) as i32;

    score += match strategy.recruitment {
        RecruitmentPhilosophy::YouthDevelopment => {
            growth_room * 2 + if target.age <= 21 { 18 } else { 0 }
        }
        RecruitmentPhilosophy::Rebuild => growth_room + if target.age <= 24 { 12 } else { -4 },
        RecruitmentPhilosophy::Value => {
            growth_room / 2 + value_efficiency_bonus(target.overall, target.potential, target.fee)
        }
        RecruitmentPhilosophy::WinNow => {
            i32::from(target.overall) / 2
                + if (24..=29).contains(&target.age) {
                    12
                } else {
                    0
                }
        }
        RecruitmentPhilosophy::Balanced => growth_room / 2 + i32::from(target.overall) / 4,
    };

    if !strategy_allows_fee(strategy, target.fee, transfer_budget) {
        score -= 100;
    }

    score
}

/// Clubs should not routinely spend their entire window budget on one target.
pub fn strategy_allows_fee(strategy: &ClubStrategy, fee: u64, transfer_budget: i64) -> bool {
    if transfer_budget <= 0 {
        return false;
    }
    let max_single_deal =
        (transfer_budget as f64 * f64::from(strategy.single_deal_budget_fraction())) as u64;
    fee <= max_single_deal.max(1)
}

fn value_efficiency_bonus(overall: u8, potential: u8, fee: u64) -> i32 {
    let quality = u64::from(overall) + u64::from(potential) / 2;
    let millions = (fee / 1_000_000).max(1);
    (quality / millions).min(30) as i32
}

#[cfg(test)]
mod tests {
    use super::*;

    fn strategy(recruitment: RecruitmentPhilosophy) -> ClubStrategy {
        ClubStrategy {
            recruitment,
            ..ClubStrategy::default()
        }
    }

    #[test]
    fn youth_club_prefers_high_ceiling_prospect() {
        let youth = strategy(RecruitmentPhilosophy::YouthDevelopment);
        let prospect = StrategicTarget {
            base_score: 50,
            age: 19,
            overall: 70,
            potential: 91,
            fee: 5_000_000,
        };
        let veteran = StrategicTarget {
            base_score: 50,
            age: 31,
            overall: 82,
            potential: 82,
            fee: 5_000_000,
        };
        assert!(
            strategic_target_score(&youth, prospect, 30_000_000)
                > strategic_target_score(&youth, veteran, 30_000_000)
        );
    }

    #[test]
    fn win_now_club_prefers_ready_made_quality() {
        let win_now = strategy(RecruitmentPhilosophy::WinNow);
        let prime = StrategicTarget {
            base_score: 50,
            age: 27,
            overall: 88,
            potential: 89,
            fee: 8_000_000,
        };
        let prospect = StrategicTarget {
            base_score: 50,
            age: 18,
            overall: 67,
            potential: 94,
            fee: 8_000_000,
        };
        assert!(
            strategic_target_score(&win_now, prime, 40_000_000)
                > strategic_target_score(&win_now, prospect, 40_000_000)
        );
    }

    #[test]
    fn conservative_club_rejects_budget_consuming_deal() {
        let mut value = strategy(RecruitmentPhilosophy::Value);
        value.financial_risk = 20;
        assert!(!strategy_allows_fee(&value, 5_000_000, 10_000_000));
        assert!(strategy_allows_fee(&value, 2_000_000, 10_000_000));
    }
}
