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
}
