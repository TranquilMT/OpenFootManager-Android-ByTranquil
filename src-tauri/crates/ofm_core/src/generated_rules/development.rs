pub fn minutes_factor(minutes: u32) -> u8 {
    match minutes {
        0..=449 => 60,
        450..=899 => 75,
        900..=1799 => 90,
        _ => 100,
    }
}
