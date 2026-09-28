use ofm_core::generated_balance::{LeagueTier, clamp_generated_ovr};

#[test]
fn elite_generated_ceiling_is_96() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Elite, 99, false), 96);
}
