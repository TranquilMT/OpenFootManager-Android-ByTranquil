use super::*;

#[test]
fn unaffordable_wages_block_transfer_without_mutating_game() {
    let mut player = make_player("salary-check");
    player.wage = 3_000_000;
    let mut game = make_game_with_player(player, vec![], 5_000_000, 2_000_000);
    let before = serde_json::to_string(&game).unwrap();
    let error = make_transfer_bid(&mut game, "salary-check", 2_000_000).unwrap_err();
    assert!(error.starts_with("be.error.contracts.boardWagePolicy"));
    assert_eq!(serde_json::to_string(&game).unwrap(), before);
}

#[test]
fn fee_alone_is_insufficient_without_four_week_salary_reserve() {
    let player = make_player("cash-check");
    let mut game = make_game_with_player(player, vec![], 2_000_000, 2_000_000);
    let before = serde_json::to_string(&game).unwrap();
    assert!(make_transfer_bid(&mut game, "cash-check", 2_000_000).is_err());
    assert_eq!(serde_json::to_string(&game).unwrap(), before);
}

#[test]
fn accepted_transfer_assigns_paid_age_appropriate_contract() {
    let mut player = make_player("signed-player");
    player.date_of_birth = "2009-01-01".into();
    player.contract_end = Some("2026-08-20".into());
    let mut game = make_game_with_player(player, vec![], 5_000_000, 2_000_000);
    let outcome = make_transfer_bid(&mut game, "signed-player", 2_000_000).unwrap();
    assert_eq!(outcome.decision, TransferNegotiationDecision::Accepted);
    let player = &game.players[0];
    assert_eq!(player.team_id.as_deref(), Some("team-1"));
    assert!(player.wage > 0);
    assert_eq!(player.contract_end.as_deref(), Some("2029-08-01"));
    assert!(ofm_core::finances::journal_matches_cash(&game));
}
