use super::calc_matchday;
use crate::game::Game;
use domain::team::Team;

pub(crate) fn match_ticket_price(team: &Team) -> f64 {
    // Basic ticket equivalent, not a claim about actual club ticket prices.
    8.0 + f64::from(team.reputation.min(1000)) * 0.037
}

pub(crate) fn match_attendance(team: &Team) -> f64 {
    if team.stadium_capacity == 0 {
        return 0.0;
    }
    let demand = 0.45 + f64::from(team.reputation.min(1000)) * 0.0004;
    // Stadium size alone cannot generate elite turnover for a small club.
    let annual_gate_budget = crate::club_economy::annual_revenue_anchor(team) as f64 * 0.30;
    let capacity_receipts = f64::from(team.stadium_capacity) * match_ticket_price(team) * 19.0;
    demand.min(annual_gate_budget / capacity_receipts)
}

pub(super) fn count_recent_home_matches(game: &Game, team_id: &str) -> i64 {
    let current = game.clock.current_date.date_naive();
    let week_ago = current - chrono::Duration::days(7);
    let mut paid = std::collections::HashSet::new();
    game.competitions
        .iter()
        .chain(game.league.iter())
        .flat_map(|league| &league.fixtures)
        .filter(|fixture| {
            fixture.status == domain::league::FixtureStatus::Completed
                && fixture.home_team_id == team_id
                && fixture.result.is_some()
        })
        .filter(|fixture| {
            chrono::NaiveDate::parse_from_str(&fixture.date, "%Y-%m-%d")
                .is_ok_and(|date| date > week_ago && date <= current)
        })
        .filter(|fixture| paid.insert(fixture.id.clone()))
        .count() as i64
}

/// Recurring forecasts average the current season's known home schedule.
/// Actual settlement still posts only completed matches from the past week.
pub(super) fn estimated_weekly_matchday_income(game: &Game, team: &Team) -> i64 {
    let mut counted = std::collections::HashSet::new();
    let home_matches = game
        .competitions
        .iter()
        .chain(game.league.iter())
        .flat_map(|league| &league.fixtures)
        .filter(|fixture| fixture.home_team_id == team.id)
        .filter(|fixture| chrono::NaiveDate::parse_from_str(&fixture.date, "%Y-%m-%d").is_ok())
        .filter(|fixture| counted.insert(fixture.id.clone()))
        .count() as i64;
    calc_matchday(
        team.stadium_capacity,
        home_matches,
        match_attendance(team),
        match_ticket_price(team),
    ) / 52
}
