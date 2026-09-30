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
}
