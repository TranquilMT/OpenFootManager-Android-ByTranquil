use crate::game::Game;
use domain::league::StandingEntry;

/// Generated divisions share one payout scale, preserving the reward ordering
/// without handing a grassroots champion several years of operating income.
/// This is a game calibration, not a claim about actual competition prizes.
pub(super) fn champion_prize_cap(game: &Game, standings: &[StandingEntry], tier: u32) -> i64 {
    let original = super::division_prize_money(1, tier);
    if !game.package_lockfile.is_empty() || game.emitted_events.contains("world:authored") {
        return original;
    }
    let clubs: Vec<_> = standings
        .iter()
        .filter_map(|standing| game.teams.iter().find(|team| team.id == standing.team_id))
        .collect();
    if clubs.is_empty() || clubs.iter().any(|team| team.economy.version == 0) {
        return original;
    }
    let revenue: i128 = clubs
        .iter()
        .map(|team| {
            let sponsor = team
                .sponsorship
                .as_ref()
                .filter(|sponsor| sponsor.remaining_weeks > 0)
                .map_or(0, |sponsor| i128::from(sponsor.base_value.max(0)) * 52);
            i128::from(team.economy.annual_operating_income.max(0))
                + sponsor
                + i128::from(crate::finances::estimated_weekly_matchday_income(game, team).max(0))
                    * 52
        })
        .sum();
    (revenue / clubs.len() as i128 / 10).min(i128::from(original)) as i64
}

pub(super) fn scaled_prize(position: u32, tier: u32, champion_cap: i64) -> i64 {
    let champion = super::division_prize_money(1, tier);
    if champion == 0 {
        return 0;
    }
    (i128::from(super::division_prize_money(position, tier)) * i128::from(champion_cap)
        / i128::from(champion)) as i64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scaled_prizes_preserve_order_and_elite_and_legacy_limits() {
        assert_eq!(scaled_prize(1, 0, 60_000), 60_000);
        assert_eq!(scaled_prize(2, 0, 60_000), 36_000);
        assert_eq!(scaled_prize(3, 0, 60_000), 18_000);
        assert_eq!(scaled_prize(0, 0, 60_000), 0);
        assert_eq!(scaled_prize(1, 0, 5_000_000), 5_000_000);
        assert_eq!(scaled_prize(1, 1, 2_500_000), 2_500_000);
    }
}
