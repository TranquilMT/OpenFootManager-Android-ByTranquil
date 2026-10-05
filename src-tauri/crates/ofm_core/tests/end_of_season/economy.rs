use super::*;

#[test]
fn generated_small_league_prize_is_scaled_and_inbox_matches_journal() {
    let mut game = make_completed_season_game();
    for team in &mut game.teams {
        team.economy.version = 3;
        team.economy.annual_operating_income = 600_000;
        team.stadium_capacity = 0;
    }
    process_end_of_season(&mut game);
    let paid: i64 = game.teams[0]
        .financial_ledger
        .iter()
        .filter(|entry| entry.kind == FinancialTransactionKind::PrizeMoney)
        .map(|entry| entry.amount)
        .sum();
    assert_eq!(paid, 60_000);
    let runner_up: i64 = game.teams[1]
        .financial_ledger
        .iter()
        .filter(|entry| entry.kind == FinancialTransactionKind::PrizeMoney)
        .map(|entry| entry.amount)
        .sum();
    assert_eq!(runner_up, 36_000);
    let message = game
        .messages
        .iter()
        .find(|message| message.id == "season_payout_1")
        .unwrap();
    assert_eq!(message.i18n_params.get("amount"), Some(&paid.to_string()));
    assert!(ofm_core::finances::journal_matches_cash(&game));
}

#[test]
fn authored_world_keeps_original_prize_scale() {
    let mut game = make_completed_season_game();
    game.emitted_events.insert("world:authored".into());
    for team in &mut game.teams {
        team.economy.version = 3;
        team.economy.annual_operating_income = 600_000;
        team.stadium_capacity = 0;
    }
    process_end_of_season(&mut game);
    assert_eq!(
        game.teams[0]
            .financial_ledger
            .iter()
            .filter(|entry| entry.kind == FinancialTransactionKind::PrizeMoney)
            .map(|entry| entry.amount)
            .sum::<i64>(),
        5_000_000
    );
}
