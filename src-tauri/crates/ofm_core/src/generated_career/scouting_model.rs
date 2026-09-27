pub fn uncertainty(scout_quality: u8, knowledge: u8) -> u8 {
    20u8.saturating_sub(scout_quality.min(100) / 10)
        .saturating_sub(knowledge.min(100) / 12)
        .max(1)
}
pub fn displayed_range(ovr: u8, error: u8) -> (u8, u8) {
    (ovr.saturating_sub(error), ovr.saturating_add(error).min(96))
}
