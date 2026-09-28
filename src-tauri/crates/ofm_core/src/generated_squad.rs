//! Generated-squad planning for database-free careers.
use crate::generated_balance::{
    LeagueTier, SquadRole, academy_potential, club_role_target_ovr, weekly_wage_eur,
};
pub const GENERATED_SQUAD_SIZE: usize = 22;
pub const STARTING_CORE_SLOTS: [usize; 11] = [0, 2, 3, 4, 5, 9, 10, 11, 12, 16, 17];
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SquadGroup {
    Goalkeeper,
    Defender,
    Midfielder,
    Forward,
}
pub fn group_for_slot(slot: usize) -> SquadGroup {
    match slot {
        0..=1 => SquadGroup::Goalkeeper,
        2..=8 => SquadGroup::Defender,
        9..=15 => SquadGroup::Midfielder,
        _ => SquadGroup::Forward,
    }
}
pub fn minimum_group_count(group: SquadGroup) -> usize {
    match group {
        SquadGroup::Goalkeeper => 2,
        SquadGroup::Defender => 4,
        SquadGroup::Midfielder => 4,
        SquadGroup::Forward => 2,
    }
}
pub fn role_for_slot(slot: usize) -> SquadRole {
    match slot {
        0 | 2 | 3 | 9 | 10 | 16 => SquadRole::Starter,
        4 | 5 | 11 | 12 | 17 => SquadRole::Rotation,
        6 | 13 | 18 | 19 => SquadRole::Depth,
        7 | 14 | 20 => SquadRole::Prospect,
        1 | 8 | 15 | 21 => SquadRole::Academy,
        _ => SquadRole::Depth,
    }
}
pub fn academy_slot_count() -> usize {
    (0..22)
        .filter(|s| role_for_slot(*s) == SquadRole::Academy)
        .count()
}
pub fn senior_age_range(role: SquadRole) -> (u8, u8) {
    match role {
        SquadRole::Star => (22, 31),
        SquadRole::Starter => (21, 32),
        SquadRole::Rotation => (20, 33),
        SquadRole::Depth => (20, 34),
        SquadRole::Prospect => (17, 22),
        SquadRole::Academy => (16, 20),
    }
}
pub fn target_age_for_slot(slot: usize) -> u8 {
    let (lo, hi) = senior_age_range(role_for_slot(slot));
    lo + ((slot as u8 * 3) % (hi - lo + 1))
}
pub fn captain_candidate(slot: usize) -> bool {
    matches!(slot, 0 | 2 | 3 | 9 | 10) && target_age_for_slot(slot) >= 24
}
pub fn elite_star_slots(tier: LeagueTier, reputation: u8, financial_strength: u8) -> usize {
    if !matches!(tier, LeagueTier::Elite | LeagueTier::Top) {
        return 0;
    }
    let strength = (reputation.min(100) as u16 + financial_strength.min(100) as u16) / 2;
    match strength {
        90..=100 => 4,
        80..=89 => 3,
        70..=79 => 2,
        60..=69 => 1,
        _ => 0,
    }
}
pub fn slot_variance(slot: usize) -> i8 {
    match slot % 7 {
        0 => 2,
        1 => -2,
        2 => 1,
        3 => 0,
        4 => -1,
        5 => 1,
        _ => -1,
    }
}
pub fn target_ovr_for_slot(
    slot: usize,
    tier: LeagueTier,
    reputation: u8,
    financial_strength: u8,
) -> u8 {
    let mut role = role_for_slot(slot);
    let stars = elite_star_slots(tier, reputation, financial_strength);
    if stars > 0 && matches!(slot, 0 | 2 | 9 | 10 | 16) {
        let rank = match slot {
            16 => 0,
            10 => 1,
            9 => 2,
            2 => 3,
            _ => 4,
        };
        if rank < stars {
            role = SquadRole::Star
        }
    }
    let base = club_role_target_ovr(tier, role, reputation, financial_strength) as i16;
    (base + slot_variance(slot) as i16).clamp(30, 96) as u8
}
pub fn squad_average_ovr(tier: LeagueTier, reputation: u8, financial_strength: u8) -> u8 {
    let total: u16 = (0..22)
        .map(|s| target_ovr_for_slot(s, tier, reputation, financial_strength) as u16)
        .sum();
    (total / 22) as u8
}
pub fn starting_core_average_ovr(tier: LeagueTier, reputation: u8, financial_strength: u8) -> u8 {
    let total: u16 = STARTING_CORE_SLOTS
        .iter()
        .map(|s| target_ovr_for_slot(*s, tier, reputation, financial_strength) as u16)
        .sum();
    (total / 11) as u8
}
pub fn depth_quality_gap(tier: LeagueTier, reputation: u8, financial_strength: u8) -> u8 {
    starting_core_average_ovr(tier, reputation, financial_strength)
        .saturating_sub(squad_average_ovr(tier, reputation, financial_strength))
}
pub fn suggested_transfer_budget(tier: LeagueTier, reputation: u8, financial_strength: u8) -> i64 {
    let ovr = squad_average_ovr(tier, reputation, financial_strength) as i64;
    let wealth = financial_strength.min(100) as i64;
    ((ovr - 30).max(5).pow(2) * wealth.max(20) * 1_500).clamp(250_000, 250_000_000)
}
pub fn target_potential_for_slot(
    slot: usize,
    tier: LeagueTier,
    reputation: u8,
    academy_quality: u8,
) -> u8 {
    let current = target_ovr_for_slot(slot, tier, reputation, academy_quality);
    match role_for_slot(slot) {
        SquadRole::Academy | SquadRole::Prospect => {
            academy_potential(tier, reputation, academy_quality, current)
        }
        _ => current.saturating_add(2).min(96),
    }
}
pub fn target_weekly_wage_for_slot(
    slot: usize,
    tier: LeagueTier,
    reputation: u8,
    financial_strength: u8,
) -> i64 {
    weekly_wage_eur(
        target_ovr_for_slot(slot, tier, reputation, financial_strength),
        reputation,
    )
}
pub fn estimated_weekly_payroll(tier: LeagueTier, reputation: u8, financial_strength: u8) -> i64 {
    (0..22)
        .map(|s| target_weekly_wage_for_slot(s, tier, reputation, financial_strength))
        .sum()
}
pub fn payroll_guardrail(
    tier: LeagueTier,
    reputation: u8,
    financial_strength: u8,
    weekly_budget: i64,
) -> bool {
    estimated_weekly_payroll(tier, reputation, financial_strength) <= weekly_budget
}
pub fn squad_plan_is_valid(tier: LeagueTier, reputation: u8, financial_strength: u8) -> bool {
    academy_slot_count() == 4
        && (0..22).all(|s| {
            let o = target_ovr_for_slot(s, tier, reputation, financial_strength);
            (30..=96).contains(&o)
        })
        && STARTING_CORE_SLOTS.iter().all(|s| *s < 22)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn plans_validate_across_tiers() {
        for tier in [
            LeagueTier::Elite,
            LeagueTier::Top,
            LeagueTier::Professional,
            LeagueTier::Lower,
            LeagueTier::Grassroots,
        ] {
            assert!(squad_plan_is_valid(tier, 70, 70))
        }
    }
    #[test]
    fn elite_club_has_larger_transfer_budget() {
        assert!(
            suggested_transfer_budget(LeagueTier::Elite, 90, 95)
                > suggested_transfer_budget(LeagueTier::Lower, 45, 35)
        )
    }
}
