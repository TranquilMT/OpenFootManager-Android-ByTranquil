use ofm_core::generated_balance::{LeagueTier, SquadRole, rating_band, role_target_ovr};
#[test]
fn top_prospect_below_core() {
    assert!(
        role_target_ovr(LeagueTier::Top, SquadRole::Prospect)
            < rating_band(LeagueTier::Top).core_low
    );
}
