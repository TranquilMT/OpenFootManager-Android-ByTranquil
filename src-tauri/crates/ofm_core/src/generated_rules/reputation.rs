pub fn from_ovr(ovr: u8) -> u8 {
    ovr.saturating_sub(30).saturating_mul(2).min(100)
}
