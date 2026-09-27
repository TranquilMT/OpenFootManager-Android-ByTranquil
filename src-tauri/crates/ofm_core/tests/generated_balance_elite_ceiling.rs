use ofm_core::generated_balance::{clamp_generated_ovr, LeagueTier};

#[test]
fn elite_generated_ceiling_is_96() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Elite, 99, false), 96);
}
