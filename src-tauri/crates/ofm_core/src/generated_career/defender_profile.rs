pub fn centre_back(target: u8) -> [u8; 6] {
    [
        target.saturating_add(3).min(96),
        target.saturating_add(2).min(96),
        target,
        target.saturating_sub(2),
        target.saturating_sub(4),
        target.saturating_sub(6),
    ]
}
pub fn full_back(target: u8) -> [u8; 6] {
    [
        target,
        target.saturating_add(3).min(96),
        target.saturating_add(2).min(96),
        target,
        target.saturating_sub(2),
        target.saturating_sub(5),
    ]
}
