use ofm_core::generated_balance::{LeagueTier, clamp_generated_ovr};

#[test]
fn professional_overflow_clamps() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Professional, 99, false), 90);
}
