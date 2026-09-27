pub fn suitability(age: u8, composure: u8, reputation: u8) -> u8 {
    ((age.min(35) as u16 + composure as u16 + reputation as u16) / 3).min(100) as u8
}
