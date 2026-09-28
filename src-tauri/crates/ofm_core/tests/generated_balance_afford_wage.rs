use ofm_core::generated_balance::club_can_afford;
#[test]
fn wage_must_fit_room() {
    assert!(!club_can_afford(1_000_000, 80_000, 10_000_000, 20_000));
}
