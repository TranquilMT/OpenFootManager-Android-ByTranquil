use ofm_core::generated_balance::{LeagueTier, SquadRole, role_target_ovr};
#[test]
fn rotation_sits_between_starter_and_depth() {
    let r = role_target_ovr(LeagueTier::Professional, SquadRole::Rotation);
    assert!(
        r < role_target_ovr(LeagueTier::Professional, SquadRole::Starter)
            && r > role_target_ovr(LeagueTier::Professional, SquadRole::Depth)
    );
}
