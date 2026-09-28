use ofm_core::generated_balance::{LeagueTier, SquadRole, role_target_ovr};
#[test]
fn elite_stars_outscore_starters() {
    assert!(
        role_target_ovr(LeagueTier::Elite, SquadRole::Star)
            > role_target_ovr(LeagueTier::Elite, SquadRole::Starter)
    );
}
