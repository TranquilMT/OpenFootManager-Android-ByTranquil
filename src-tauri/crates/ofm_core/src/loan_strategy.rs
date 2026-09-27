use crate::club_strategy::{ClubStrategy, RecruitmentPhilosophy, StrategicStatus};

#[derive(Debug, Clone, Copy)]
pub struct LoanTarget {
    pub base_score: i32,
    pub age: u8,
    pub overall: u8,
    pub potential: u8,
    pub wage: u32,
}

/// Buyer-specific loan interest. Loans are deliberately treated differently
/// from permanent transfers: development/rebuild clubs value upside, while
/// win-now clubs use loans mainly for immediately useful squad depth.
pub fn strategic_loan_score(strategy: &ClubStrategy, target: LoanTarget) -> i32 {
    let mut score = target.base_score + strategy.age_preference_score(target.age) as i32;
    let upside = target.potential.saturating_sub(target.overall) as i32;

    match strategy.recruitment {
        RecruitmentPhilosophy::YouthDevelopment => {
            score += upside * 3;
            if target.age <= 21 {
                score += 18;
            }
        }
        RecruitmentPhilosophy::Rebuild => {
            score += upside * 2;
            if target.age <= 24 {
                score += 10;
            }
        }
        RecruitmentPhilosophy::Value => {
            score += upside;
            score -= (target.wage / 100_000) as i32;
        }
        RecruitmentPhilosophy::WinNow => {
            score += (target.overall as i32 - 60).max(0) * 2;
            if (23..=29).contains(&target.age) {
                score += 12;
            }
        }
        RecruitmentPhilosophy::Balanced => {
            score += upside;
            score += (target.overall as i32 - 65).max(0);
        }
    }

    if strategy.status == StrategicStatus::FinancialCrisis {
        // Cash-strapped clubs can still use loans, but expensive wages should
        // push otherwise similar targets down the shortlist.
        score -= (target.wage / 75_000) as i32;
    }

    score
}

/// A strategic wage-share ceiling used when generating AI approaches. Clubs in
/// financial trouble avoid 100% wage deals unless the player's wage is modest.
pub fn strategic_loan_wage_cap(strategy: &ClubStrategy, player_wage: u32) -> u8 {
    if strategy.status == StrategicStatus::FinancialCrisis {
        if player_wage > 500_000 { 50 } else { 75 }
    } else if strategy.financial_risk <= 30 {
        75
    } else {
        100
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn youth_club_prefers_high_upside_prospect() {
        let strategy = ClubStrategy {
            recruitment: RecruitmentPhilosophy::YouthDevelopment,
            preferred_squad_age: 23,
            ..ClubStrategy::default()
        };
        let prospect = strategic_loan_score(
            &strategy,
            LoanTarget {
                base_score: 50,
                age: 19,
                overall: 64,
                potential: 84,
                wage: 100_000,
            },
        );
        let veteran = strategic_loan_score(
            &strategy,
            LoanTarget {
                base_score: 50,
                age: 31,
                overall: 76,
                potential: 76,
                wage: 100_000,
            },
        );
        assert!(prospect > veteran);
    }

    #[test]
    fn financial_crisis_caps_expensive_loan_wages() {
        let strategy = ClubStrategy {
            status: StrategicStatus::FinancialCrisis,
            ..ClubStrategy::default()
        };
        assert_eq!(strategic_loan_wage_cap(&strategy, 900_000), 50);
        assert_eq!(strategic_loan_wage_cap(&strategy, 200_000), 75);
    }
}
