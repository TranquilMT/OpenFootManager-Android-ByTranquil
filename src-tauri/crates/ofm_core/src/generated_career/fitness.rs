pub fn post_match(current: u8, minutes: u8, stamina: u8) -> u8 {
    let load = (minutes.min(120) as u16 * (120 - stamina.min(100) as u16) / 120) as u8;
    current.saturating_sub((load / 8).max(3))
}
pub fn recover(current: u8, days: u8) -> u8 {
    current.saturating_add(days.saturating_mul(6)).min(100)
}
