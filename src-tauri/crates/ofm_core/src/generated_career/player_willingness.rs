pub fn score(
    player_rep: u8,
    club_rep: u8,
    league_rep: u8,
    role_bonus: i16,
    wage_raise_pct: i16,
) -> u8 {
    let destination = (club_rep as i16 * 3 + league_rep as i16 * 2) / 5;
    let demand = player_rep as i16;
    (50 + destination - demand + role_bonus + wage_raise_pct / 5).clamp(0, 100) as u8
}
pub fn accepts(score: u8) -> bool {
    score >= 45
}
