pub fn central(target: u8) -> [u8; 6] {
    [
        target.saturating_add(3).min(96),
        target.saturating_add(2).min(96),
        target,
        target,
        target.saturating_sub(2),
        target.saturating_sub(4),
    ]
}
pub fn attacking(target: u8) -> [u8; 6] {
    [
        target.saturating_add(4).min(96),
        target.saturating_add(3).min(96),
        target.saturating_add(2).min(96),
        target,
        target.saturating_sub(3),
        target.saturating_sub(6),
    ]
}
