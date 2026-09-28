pub fn need_score(current: u8, minimum: u8, quality_gap: u8) -> u8 {
    let shortage = minimum.saturating_sub(current).saturating_mul(25);
    shortage.saturating_add(quality_gap.min(25)).min(100)
}
pub fn urgent(score: u8) -> bool {
    score >= 60
}
