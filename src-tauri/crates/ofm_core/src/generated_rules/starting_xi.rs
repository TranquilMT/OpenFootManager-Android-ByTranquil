pub fn quality_floor(squad_average: u8) -> u8 {
    squad_average.saturating_add(2).min(96)
}
