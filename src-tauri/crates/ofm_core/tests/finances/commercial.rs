use super::*;

#[test]
fn request_board_support_recovers_cash_crisis_and_applies_board_costs() {
    let mut game = make_monday_game();
    game.teams[0].finance = -25_000;
    game.teams[0].transfer_budget = 300_000;
    game.manager.satisfaction = 70;

    let result = finances::request_board_support(&mut game, "team1").expect("support");

    assert!(result.support_amount > 25_000);
    assert!(result.support_amount <= ofm_core::club_economy::annual_revenue_anchor(&game.teams[0]) / 20);
    assert_eq!(result.transfer_budget_reduction, result.support_amount / 2);
    assert_eq!(result.satisfaction_penalty, 12);
    assert_eq!(game.manager.satisfaction, 58);
    assert_eq!(game.teams[0].season_income, result.support_amount);
    assert_eq!(
        game.teams[0].transfer_budget,
        300_000 - result.transfer_budget_reduction
    );
    assert_eq!(
        game.teams[0].financial_ledger.last().expect("ledger").kind,
        FinancialTransactionKind::BoardSupport
    );
    assert!(game.teams[0].finance > 0);
}

#[test]
fn request_board_support_rejects_second_support_package_in_same_season() {
    let mut game = make_monday_game();
    game.teams[0].finance = -25_000;

    finances::request_board_support(&mut game, "team1").expect("first support");
    game.teams[0].finance = -10_000;

    let error = finances::request_board_support(&mut game, "team1").expect_err("should fail");

    assert_eq!(error, "be.error.finance.boardSupportAlreadyUsed");
}

#[test]
fn finance_action_previews_are_available_without_mutating_state() {
    let mut game = make_monday_game();
    game.teams[0].finance = -40_000;
    game.teams[0].wage_budget = 50_000;

    let previews = finances::finance_action_previews(&game, "team1").expect("previews");

    assert!(previews.board_support.is_some());
    assert!(previews.sponsor_pitch.is_some());
    assert!(previews.marketing_campaign.is_none(), "campaigns require cash to fund activation");
    assert_eq!(game.teams[0].finance, -40_000);
    assert!(game.messages.is_empty());
    assert!(game.teams[0].financial_ledger.is_empty());
}

#[test]
fn request_board_support_can_recover_runway_without_random_events() {
    let mut game = make_monday_game();
    game.teams[0].finance = 13_600;

    let preview = finances::preview_board_support(&game, "team1").expect("preview");
    let result = finances::request_board_support(&mut game, "team1").expect("support");
    let snapshot = finances::team_finance_snapshot(&game, "team1").expect("snapshot");

    assert_eq!(result.support_amount, preview.support_amount);
    assert_eq!(
        result.transfer_budget_reduction,
        preview.transfer_budget_reduction
    );
    assert_eq!(result.satisfaction_penalty, preview.satisfaction_penalty);
    assert_eq!(
        snapshot.overall_status,
        finances::FinanceHealthLevel::Stable
    );
}

#[test]
fn request_sponsor_pitch_creates_pending_offer_for_over_budget_team() {
    let mut game = make_monday_game();
    game.teams[0].wage_budget = 50_000;

    let result = finances::request_sponsor_pitch(&mut game, "team1").expect("pitch response");

    assert_eq!(result.duration_weeks, 12);
    assert!(result.weekly_amount > 0);
    assert!(result.weekly_amount * 52 <= ofm_core::club_economy::annual_revenue_anchor(&game.teams[0]) * 4 / 100);
    let message = game
        .messages
        .iter()
        .find(|message| message.id == result.message_id)
        .expect("sponsor offer message");
    assert!(message.id.starts_with("sponsor_"));
    assert!(message.actions.iter().any(|action| !action.resolved));
    assert_eq!(
        message.subject_key.as_deref(),
        Some("be.msg.sponsor.subject")
    );
    assert_eq!(message.body_key.as_deref(), Some("be.msg.sponsor.body"));
    assert_eq!(
        message.sender_key.as_deref(),
        Some("be.sender.commercialDirector")
    );
    assert!(message.subject.is_empty());
    assert!(message.body.is_empty());
    assert!(message.sender.is_empty());
}

#[test]
fn request_sponsor_pitch_rejects_healthy_club() {
    let mut game = make_monday_game();
    game.teams[0].wage_budget = 5_000_000;
    game.teams[0].finance = 2_000_000;

    let error =
        finances::request_sponsor_pitch(&mut game, "team1").expect_err("healthy club should fail");

    assert_eq!(error, "be.error.finance.sponsorPitchUnavailable");
}

#[test]
fn request_sponsor_pitch_rejects_when_offer_is_already_pending() {
    let mut game = make_monday_game();
    game.teams[0].wage_budget = 50_000;
    finances::request_sponsor_pitch(&mut game, "team1").expect("first pitch");

    let error = finances::request_sponsor_pitch(&mut game, "team1")
        .expect_err("second pending pitch should fail");

    assert_eq!(error, "be.error.finance.sponsorPitchPendingOffer");
}

#[test]
fn request_sponsor_pitch_stays_capped_at_one_a_day_after_the_offer_is_gone() {
    // The daily cap is the only thing stopping a club pitching sponsors on a
    // loop. It has to survive the offer leaving the inbox — deleted by the
    // player, or resolved and later purged — which is the whole point of the
    // sent-ledger.
    let mut game = make_monday_game();
    game.teams[0].wage_budget = 50_000;
    let first = finances::request_sponsor_pitch(&mut game, "team1").expect("first pitch");

    game.messages
        .retain(|message| message.id != first.message_id);

    let error = finances::request_sponsor_pitch(&mut game, "team1")
        .expect_err("a second pitch on the same day should be refused");

    assert_eq!(error, "be.error.finance.sponsorPitchAlreadyAttemptedToday");
}

#[test]
fn request_marketing_campaign_generates_cash_for_pressured_club() {
    let mut game = make_monday_game();
    game.teams[0].wage_budget = 50_000;
    game.teams[0].finance = 60_000;

    let result = finances::request_marketing_campaign(&mut game, "team1").expect("campaign");

    assert!(result.gross_revenue >= result.net_income);
    assert!(result.campaign_cost > 0);
    assert!(result.net_income > 0);
    assert_eq!(result.cooldown_days, 28);
    assert!(result.message_id.starts_with("marketing_campaign_"));
    assert_eq!(game.teams[0].finance, 60_000 + result.net_income);
    assert_eq!(game.teams[0].season_income, result.gross_revenue);
    assert_eq!(game.teams[0].season_expenses, result.campaign_cost);
    assert_eq!(
        game.teams[0]
            .financial_ledger
            .iter()
            .filter(|entry| entry.kind == FinancialTransactionKind::CommercialCampaign)
            .count(),
        2
    );
    let message = game
        .messages
        .iter()
        .find(|message| message.id == result.message_id)
        .expect("marketing campaign message");
    assert_eq!(
        message.subject_key.as_deref(),
        Some("be.msg.marketingCampaign.subject")
    );
    assert_eq!(
        message.body_key.as_deref(),
        Some("be.msg.marketingCampaign.body")
    );
    assert_eq!(
        message.sender_key.as_deref(),
        Some("be.sender.commercialDirector")
    );
    assert!(message.subject.is_empty());
    assert!(message.body.is_empty());
    assert!(message.sender.is_empty());
}

#[test]
fn request_marketing_campaign_rejects_healthy_club() {
    let mut game = make_monday_game();
    game.teams[0].wage_budget = 5_000_000;
    game.teams[0].finance = 2_000_000;

    let error = finances::request_marketing_campaign(&mut game, "team1")
        .expect_err("healthy club should fail");

    assert_eq!(error, "be.error.finance.marketingCampaignUnavailable");
}

#[test]
fn request_marketing_campaign_respects_cooldown() {
    let mut game = make_monday_game();
    game.teams[0].wage_budget = 50_000;
    game.teams[0].finance = 10_000;

    finances::request_marketing_campaign(&mut game, "team1").expect("first campaign");

    let error = finances::request_marketing_campaign(&mut game, "team1")
        .expect_err("second campaign should fail");

    assert_eq!(error, "be.error.finance.marketingCampaignCoolingDown");
}

