use ofm_core::generated_balance::{LeagueTier, clamp_generated_ovr};
#[test]
fn elite_senior_underflow_clamps() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Elite, 10, false), 55);
}
