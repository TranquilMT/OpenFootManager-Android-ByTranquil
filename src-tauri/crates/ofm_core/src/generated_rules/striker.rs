pub fn finishing_target(ovr: u8) -> u8 {
    ovr.saturating_add(5).min(96)
}
