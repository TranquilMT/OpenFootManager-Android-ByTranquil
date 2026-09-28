use ofm_core::generated_balance::{LeagueTier, clamp_generated_ovr};
#[test]
fn fourth_tier_senior_floor_is_40() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Lower, 35, false), 40);
}
