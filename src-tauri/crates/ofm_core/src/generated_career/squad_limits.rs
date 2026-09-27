pub fn maximum_for_group(group: u8) -> u8 {
    match group {
        0 => 4,
        1 => 10,
        2 => 10,
        _ => 7,
    }
}
pub fn can_add(group: u8, current: u8) -> bool {
    current < maximum_for_group(group)
}
