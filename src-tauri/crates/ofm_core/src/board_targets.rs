#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn elite_first_season_is_top_four() { assert_eq!(league_target(1, 20, true), 4); }
}
