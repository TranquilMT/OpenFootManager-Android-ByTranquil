use ofm_core::generated_balance::{LeagueTier, rating_band};
#[test]
fn top_floor() {
    assert_eq!(rating_band(LeagueTier::Top).floor, 50);
}
