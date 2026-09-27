pub fn star_chance_per_thousand(tier: u8, stature: u8) -> u16 {
    match (tier, stature) {
        (0, 90..=100) => 55,
        (0, 80..=89) => 32,
        (0, 70..=79) => 18,
        (1, 85..=100) => 15,
        (1, 72..=84) => 7,
        _ => 1,
    }
}
pub fn superstar_cap(tier: u8) -> u8 {
    match tier {
        0 => 96,
        1 => 92,
        2 => 89,
        3 => 77,
        _ => 70,
    }
}
