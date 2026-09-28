use ofm_core::generated_balance::club_can_afford;
#[test]
fn transfer_fee_must_fit_budget() {
    assert!(!club_can_afford(10_000_000, 10_000, 5_000_000, 20_000));
}
