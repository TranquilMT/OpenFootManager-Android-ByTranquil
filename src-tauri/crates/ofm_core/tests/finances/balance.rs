use super::*;

#[test]
fn weekly_cash_debits_match_the_loan_shared_payroll_projection() {
    let mut game = make_monday_game();
    game.teams.push(make_team("borrower", "Borrower FC"));
    game.players[0].team_id = Some("borrower".into());
    game.players[0].active_loan = Some(domain::player::ActiveLoan {
        parent_team_id: "team1".into(),
        loan_team_id: "borrower".into(),
        start_date: "2025-06-01".into(),
        end_date: "2026-06-01".into(),
        wage_contribution_pct: 60,
        buy_option_fee: None,
        loan_start_minutes: 0,
        loan_start_appearances: 0,
        development_reported_minutes: 0,
        development_reported_appearances: 0,
    });
    let balances: Vec<_> = game
        .teams
        .iter()
        .map(|team| {
            (
                team.id.clone(),
                team.finance,
                finances::calc_wages(&game, &team.id),
            )
        })
        .collect();
    finances::process_weekly_finances(&mut game);
    for (id, cash, weekly) in balances {
        assert_eq!(
            game.teams
                .iter()
                .find(|team| team.id == id)
                .unwrap()
                .finance,
            cash - weekly
        );
    }
    assert!(finances::journal_matches_cash(&game));
}

#[test]
fn weekly_payroll_is_idempotent_after_save_reload() {
    let mut game = make_monday_game();
    finances::process_weekly_finances(&mut game);
    let saved = serde_json::to_string(&game).unwrap();
    let mut reloaded: Game = serde_json::from_str(&saved).unwrap();
    finances::process_weekly_finances(&mut reloaded);
    assert_eq!(serde_json::to_string(&reloaded).unwrap(), saved);
    assert!(finances::journal_matches_cash(&reloaded));
}

#[test]
fn fifty_two_weeks_settle_revenue_costs_and_payroll_once() {
    let mut game = make_monday_game();
    game.teams[0].economy.annual_operating_income = 5_200_000;
    game.teams[0].economy.annual_operating_cost = 4_160_000;
    let initial = game.teams[0].finance;
    let annual_payroll = finances::calc_wages(&game, "team1") * 52;
    for _ in 0..52 {
        finances::process_weekly_finances(&mut game);
        finances::process_weekly_finances(&mut game);
        game.clock.current_date += chrono::Duration::weeks(1);
    }
    assert_eq!(
        game.teams[0].finance - initial,
        5_200_000 - 4_160_000 - annual_payroll
    );
    assert_eq!(game.teams[0].season_income, 5_200_000);
    assert_eq!(game.teams[0].season_expenses, 4_160_000 + annual_payroll);
    assert!(finances::journal_matches_cash(&game));
}

#[test]
fn forecast_uses_the_season_schedule_instead_of_repeating_last_week_income() {
    let mut game = make_monday_game();
    game.league = Some(League {
        id: "forecast".into(),
        name: "Forecast League".into(),
        season: 1,
        fixtures: ["2025-06-17", "2025-06-24"].into_iter().enumerate().map(|(id, date)| Fixture {
            id: format!("home-{id}"),
            date: date.into(),
            home_team_id: "team1".into(),
            away_team_id: "team2".into(),
            status: FixtureStatus::Scheduled,
            ..Default::default()
        }).collect(),
        ..Default::default()
    });
    let planned = finances::team_finance_snapshot(&game, "team1").unwrap();
    assert!(planned.weekly_recurring_income > 0);
    game.clock.current_date += chrono::Duration::weeks(4);
    for fixture in &mut game.league.as_mut().unwrap().fixtures {
        fixture.status = FixtureStatus::Completed;
        fixture.result = Some(MatchResult::default());
    }
    let after = finances::team_finance_snapshot(&game, "team1").unwrap();
    assert_eq!(after.weekly_recurring_income, planned.weekly_recurring_income);
    assert_eq!(after.projected_weekly_net, planned.projected_weekly_net);
}
