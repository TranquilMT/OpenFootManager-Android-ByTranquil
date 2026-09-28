use ofm_core::generated_balance::{LeagueTier, potential_ceiling};
#[test]
fn elite_academy_can_reach_world_class_potential() {
    assert!(potential_ceiling(LeagueTier::Elite, 100) >= 90);
}
