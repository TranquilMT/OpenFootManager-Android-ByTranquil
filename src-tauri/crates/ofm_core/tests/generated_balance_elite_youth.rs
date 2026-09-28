use ofm_core::generated_balance::{LeagueTier, clamp_generated_ovr};
#[test]
fn elite_youth_can_be_below_first_team_floor() {
    assert_eq!(clamp_generated_ovr(LeagueTier::Elite, 40, true), 45);
}
