use ofm_core::generated_balance::{LeagueTier, SquadRole, role_target_ovr, youth_floor};
#[test]
fn lower_prospect_not_below_academy_floor() {
    assert!(
        role_target_ovr(LeagueTier::Lower, SquadRole::Prospect) >= youth_floor(LeagueTier::Lower)
    );
}
