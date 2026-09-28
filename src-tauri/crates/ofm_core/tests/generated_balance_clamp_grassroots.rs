use ofm_core::generated_balance::{LeagueTier, clamp_generated_ovr};
#[test]
fn grassroots_senior_underflow_clamps() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Grassroots, 10, false), 34);
}
