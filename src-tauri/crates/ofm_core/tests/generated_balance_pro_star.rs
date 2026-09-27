use ofm_core::generated_balance::{LeagueTier, SquadRole, rating_band, role_target_ovr};
#[test]
fn pro_star_within_ceiling() {
    assert!(
        role_target_ovr(LeagueTier::Professional, SquadRole::Star)
            <= rating_band(LeagueTier::Professional).ceiling
    );
}
