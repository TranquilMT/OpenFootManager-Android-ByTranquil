/// Relative club strength sets ambition; a new manager receives room to build.
pub fn league_target(rank: u32, size: u32, first_season: bool) -> u32 {
    let size = size.max(1);
    let rank = rank.clamp(1, size);
    let elite_floor = if first_season { (size / 5).max(2) } else { 2 };
    let margin = u32::from(first_season && rank > elite_floor);
    rank.max(elite_floor).saturating_add(margin).min(size)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn elite_first_season_is_top_four() { assert_eq!(league_target(1, 20, true), 4); }
    #[test]
    fn elite_established_is_top_two() { assert_eq!(league_target(1, 20, false), 2); }
    #[test]
    fn rank_four_first_season_has_margin() { assert_eq!(league_target(4, 20, true), 5); }
    #[test]
    fn midtable_target_is_realistic() { assert_eq!(league_target(10, 20, true), 11); }
    #[test]
    fn bottom_club_target_stays_in_table() { assert_eq!(league_target(20, 20, true), 20); }
    #[test]
    fn one_club_target_is_one() { assert_eq!(league_target(1, 1, true), 1); }
    #[test]
    fn empty_table_target_is_safe() { assert_eq!(league_target(1, 0, true), 1); }
    #[test]
    fn small_league_has_top_two_target() { assert_eq!(league_target(1, 4, true), 2); }
    #[test]
    fn rank_is_clamped_to_table() { assert_eq!(league_target(99, 10, false), 10); }
    #[test]
    fn zero_rank_is_normalized() { assert_eq!(league_target(0, 20, true), 4); }
}
