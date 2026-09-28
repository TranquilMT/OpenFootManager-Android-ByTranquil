pub fn potential_floor(current: u8) -> u8 {
    current.saturating_add(8).min(96)
}
