use crate::game::Game;
use domain::league::{CompetitionFormat, CompetitionScope, CompetitionType, FixtureStatus};
use std::collections::HashMap;

/// Domestic tables are authoritative; the legacy mirror is only a fallback.
/// In split seasons the latest edition and most recently played half win.
pub(super) fn league_positions(game: &Game) -> HashMap<String, u32> {
    let mut positions = HashMap::new();
    if let Some(league) = &game.league {
        for (index, standing) in league.sorted_standings().into_iter().enumerate() {
            positions.insert(standing.team_id, index as u32 + 1);
        }
    }
    let mut leagues: Vec<_> = game
        .competitions
        .iter()
        .filter(|league| {
            league.scope == CompetitionScope::Domestic
                && league.kind == CompetitionType::League
                && league.rules.format == CompetitionFormat::LeagueTable
        })
        .collect();
    leagues.sort_by_key(|league| {
        (
            league.season,
            league
                .fixtures
                .iter()
                .filter(|fixture| {
                    fixture.counts_for_league_standings()
                        && fixture.status == FixtureStatus::Completed
                })
                .map(|fixture| fixture.date.as_str())
                .max(),
            std::cmp::Reverse(league.priority),
            league.id.as_str(),
        )
    });
    for league in leagues {
        for (index, standing) in league.sorted_standings().into_iter().enumerate() {
            positions.insert(standing.team_id, index as u32 + 1);
        }
    }
    positions
}

#[cfg(test)]
mod tests {
    use super::super::tests::make_game;
    use domain::league::League;

    #[test]
    fn sponsor_bonus_uses_clubs_own_domestic_division_in_forecast_and_settlement() {
        use domain::team::{Sponsorship, SponsorshipBonusCriterion};
        let mut game = make_game();
        let mut division = League::new(
            "second".into(),
            "Second Division".into(),
            2026,
            &["team2".into(), "opponent".into()],
        );
        division
            .standings
            .iter_mut()
            .find(|s| s.team_id == "team2")
            .unwrap()
            .points = 30;
        game.competitions = vec![game.league.clone().unwrap(), division];
        game.competitions[0]
            .participant_ids
            .retain(|id| id != "team2");
        game.competitions[0]
            .standings
            .retain(|s| s.team_id != "team2");
        game.teams[1].sponsorship = Some(Sponsorship {
            auto_renew: false,
            sponsor_name: "Test".into(),
            base_value: 1000,
            remaining_weeks: 10,
            bonus_criteria: vec![SponsorshipBonusCriterion::LeaguePosition {
                max_position: 1,
                bonus_amount: 500,
            }],
        });
        let snapshot = crate::finances::team_finance_snapshot(&game, "team2").unwrap();
        assert_eq!(snapshot.weekly_sponsor_income, 1500);
        crate::finances::process_weekly_finances(&mut game);
        let paid: i64 = game
            .cash_journal
            .iter()
            .filter(|entry| {
                entry.club_id == "team2" && entry.kind == crate::finances::CashKind::Sponsorship
            })
            .map(|entry| entry.amount)
            .sum();
        assert_eq!(paid, 1500);
    }
    #[test]
    fn domestic_table_overrides_stale_legacy_and_cup_tables_in_any_order() {
        let mut game = make_game();
        let domestic = game.league.clone().unwrap();
        let mut cup = domestic.clone();
        cup.id = "regional-cup".into();
        cup.kind = domain::league::CompetitionType::Cup;
        cup.season = 2030;
        cup.standings
            .iter_mut()
            .find(|s| s.team_id == "team2")
            .unwrap()
            .points = 100;
        game.league = Some(cup.clone());
        game.competitions = vec![domestic, cup];
        assert_eq!(super::league_positions(&game).get("team2"), Some(&2));
        game.competitions.reverse();
        assert_eq!(super::league_positions(&game).get("team2"), Some(&2));
    }
}
