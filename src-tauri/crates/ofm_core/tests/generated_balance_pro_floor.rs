use ofm_core::generated_balance::{LeagueTier, rating_band};
#[test]
fn professional_floor() {
    assert_eq!(rating_band(LeagueTier::Professional).floor, 45);
}
