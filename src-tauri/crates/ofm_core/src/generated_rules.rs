//! Rules used by database-free generated careers.
pub mod academy;
pub mod attacking_midfielder;
pub mod bench;
pub mod captain;
pub mod centre_back;
pub mod contract;
pub mod decline;
pub mod development;
pub mod finance;
pub mod fitness;
pub mod form;
pub mod free_agent;
pub mod full_back;
pub mod goalkeeper;
pub mod injury;
pub mod leadership;
pub mod loan;
pub mod midfielder;
pub mod morale;
pub mod prospect;
pub mod registration;
pub mod reputation;
pub mod scouting;
pub mod squad_depth;
pub mod starting_xi;
pub mod striker;
pub mod training;
pub mod transfer;
pub mod value;
pub mod veteran;
pub mod wage;
pub mod winger;
pub fn clamp_rating(value: i16) -> u8 {
    value.clamp(25, 96) as u8
}
pub fn tier_floor(tier: u8) -> u8 {
    match tier {
        0 => 55,
        1 => 50,
        2 => 45,
        3 => 40,
        _ => 34,
    }
}
pub fn tier_ceiling(tier: u8) -> u8 {
    match tier {
        0 => 96,
        1 => 92,
        2 => 89,
        3 => 73,
        _ => 65,
    }
}
pub fn club_stature(reputation: u8, wealth: u8) -> u8 {
    (((reputation.min(100) as u16) * 3 + (wealth.min(100) as u16) * 2) / 5) as u8
}
pub fn youth_discount(age: u8) -> u8 {
    match age {
        0..=16 => 20,
        17 => 17,
        18 => 14,
        19 => 11,
        20 => 8,
        21 => 5,
        _ => 0,
    }
}
pub fn potential_headroom(age: u8) -> u8 {
    match age {
        0..=17 => 24,
        18..=20 => 18,
        21..=23 => 12,
        24..=26 => 7,
        27..=29 => 3,
        _ => 1,
    }
}
pub fn decline_pressure(age: u8) -> u8 {
    match age {
        0..=29 => 0,
        30..=31 => 1,
        32..=33 => 2,
        34..=35 => 4,
        _ => 6,
    }
}
pub fn elite_allowed(tier: u8, club_stature: u8) -> bool {
    tier <= 1 && club_stature >= 72
}
