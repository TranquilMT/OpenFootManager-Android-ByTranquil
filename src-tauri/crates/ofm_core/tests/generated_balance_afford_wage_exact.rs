use ofm_core::generated_balance::club_can_afford;
#[test]
fn exact_wage_room_is_affordable() {
    assert!(club_can_afford(1_000_000, 25_000, 2_000_000, 25_000));
}
