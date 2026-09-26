use crate::generated_balance::LeagueTier;

pub fn quality_offset(slot: usize) -> i8 {
    match slot {
        0..=2 => 5,
        3..=7 => 3,
        8..=12 => 0,
        13..=16 => -3,
        17..=19 => -6,
        _ => -10,
    }
}

/// Add a few distinct standout players to the top divisions without raising
/// every squad member or weakening the existing floor in smaller leagues.
fn high_tier_bonus(tier: LeagueTier, slot: usize) -> i8 {
    match tier {
        LeagueTier::Elite => match slot {
            0 => 4,
            1 => 2,
            3 => 3,
            6 => 2,
            _ => 0,
        },
        LeagueTier::Top => match slot {
            0 => 3,
            3 => 2,
            6 => 1,
            _ => 0,
        },
        _ => 0,
    }
}

pub fn apply_for_tier(base: u8, slot: usize, tier: LeagueTier) -> u8 {
    (base as i16 + quality_offset(slot) as i16 + high_tier_bonus(tier, slot) as i16)
        .clamp(25, 94) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn elite_and_top_clubs_have_more_distinct_standout_players() {
        assert_eq!(apply_for_tier(80, 0, LeagueTier::Elite), 89);
        assert_eq!(apply_for_tier(80, 3, LeagueTier::Elite), 86);
        assert_eq!(apply_for_tier(80, 6, LeagueTier::Elite), 85);
        assert_eq!(apply_for_tier(80, 0, LeagueTier::Top), 88);
        assert_eq!(apply_for_tier(80, 0, LeagueTier::Professional), 85);
        assert_eq!(apply_for_tier(80, 14, LeagueTier::Elite), 77);
    }

    #[test]
    fn standout_bonus_respects_the_generated_rating_cap() {
        assert_eq!(apply_for_tier(94, 0, LeagueTier::Elite), 94);
    }
}
