use ofm_core::generated_balance::{LeagueTier, potential_ceiling};
#[test]
fn lower_academy_ceiling_below_elite() {
    assert!(potential_ceiling(LeagueTier::Lower, 100) < potential_ceiling(LeagueTier::Elite, 100));
}
