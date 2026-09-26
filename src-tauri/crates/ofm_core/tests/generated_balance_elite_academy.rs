use ofm_core::generated_balance::{role_target_ovr,LeagueTier,SquadRole};
#[test]fn academy_is_below_first_team(){assert!(role_target_ovr(LeagueTier::Elite,SquadRole::Academy)<role_target_ovr(LeagueTier::Elite,SquadRole::Depth));}
