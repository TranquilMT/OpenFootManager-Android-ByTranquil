pub fn homegrown_target(squad_size: u8) -> u8 {
    (squad_size as u16 * 30).div_ceil(100) as u8
}
