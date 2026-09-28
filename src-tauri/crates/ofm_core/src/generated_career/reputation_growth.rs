pub fn season_delta(expected: u8, finish: u8, trophy: bool, promotion: bool) -> i8 {
    let over = expected as i16 - finish as i16;
    let mut d = (over / 3).clamp(-5, 5) as i8;
    if trophy {
        d += 4
    }
    if promotion {
        d += 5
    }
    d.clamp(-7, 10)
}
