pub fn qualifies(years_trained_15_to_21: u8) -> bool {
    years_trained_15_to_21 >= 3
}
pub fn registration_target(squad_size: u8) -> u8 {
    (squad_size / 4).max(4)
}
