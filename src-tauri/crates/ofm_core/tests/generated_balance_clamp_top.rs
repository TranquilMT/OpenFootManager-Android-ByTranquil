use ofm_core::generated_balance::{LeagueTier, clamp_generated_ovr};

#[test]
fn top_senior_overflow_clamps() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Top, 99, false), 92);
}
