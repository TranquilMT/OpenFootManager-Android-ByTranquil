use ofm_core::generated_balance::{LeagueTier, SquadRole, role_target_ovr};
#[test]
fn elite_depth_is_below_elite_starters() {
    assert!(
        role_target_ovr(LeagueTier::Elite, SquadRole::Depth)
            < role_target_ovr(LeagueTier::Elite, SquadRole::Starter)
    );
}
