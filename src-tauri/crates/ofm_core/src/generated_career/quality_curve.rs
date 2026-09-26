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
        .clamp(25, 96) as u8
}

const FEATURED_SLOTS: [usize; 11] = [2, 3, 4, 9, 10, 11, 16, 17, 18, 19, 20];

fn club_hash(club_id: &str) -> u32 {
    club_id.bytes().fold(2_166_136_261_u32, |hash, byte| {
        (hash ^ u32::from(byte)).wrapping_mul(16_777_619)
    })
}

pub fn featured_slot(club_id: &str) -> usize {
    FEATURED_SLOTS[club_hash(club_id) as usize % FEATURED_SLOTS.len()]
}

/// One featured senior player is distributed across outfield positions. The
/// club ID keeps the result stable when a saved world is loaded again.
pub fn apply_for_club(base: u8, slot: usize, tier: LeagueTier, club_id: &str) -> u8 {
    let ordinary = apply_for_tier(base, slot, tier);
    if slot != featured_slot(club_id) {
        return ordinary;
    }
    let roll = club_hash(club_id);
    let featured = match tier {
        LeagueTier::Elite => {
            if roll % 17 == 0 { 96 } else { 90 + (roll % 6) as u8 }
        }
        LeagueTier::Top => 85 + (roll % 7) as u8,
        LeagueTier::Professional if roll % 6 == 0 => 84 + ((roll / 6) % 6) as u8,
        _ => ordinary,
    };
    ordinary.max(featured).min(96)
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
        assert_eq!(apply_for_tier(94, 0, LeagueTier::Elite), 96);
    }

    #[test]
    fn featured_players_span_positions_and_never_use_youth_slots() {
        let positions: std::collections::HashSet<usize> = (0..100)
            .map(|id| featured_slot(&format!("club-{id}")))
            .collect();
        assert!(positions.iter().any(|slot| (2..=7).contains(slot)));
        assert!(positions.iter().any(|slot| (9..=14).contains(slot)));
        assert!(positions.iter().any(|slot| (16..=20).contains(slot)));
        assert!(positions.iter().all(|slot| ![1, 8, 15, 21].contains(slot)));
    }

    #[test]
    fn stars_are_common_in_elite_clubs_and_possible_below_the_top_tier() {
        let elite: Vec<u8> = (0..100)
            .map(|id| {
                let club = format!("club-{id}");
                apply_for_club(78, featured_slot(&club), LeagueTier::Elite, &club)
            })
            .collect();
        assert!(elite.iter().filter(|rating| **rating >= 90).count() >= 80);
        assert!(elite.contains(&96));

        let professional: Vec<u8> = (0..100)
            .map(|id| {
                let club = format!("club-{id}");
                apply_for_club(65, featured_slot(&club), LeagueTier::Professional, &club)
            })
            .collect();
        assert!(professional.iter().filter(|rating| **rating >= 84).count() >= 8);
        assert!(professional.iter().filter(|rating| **rating >= 84).count() <= 30);
    }
}
