use ofm_core::generated_balance::{role_target_ovr,LeagueTier,SquadRole};
#[test]fn lower_star_does_not_match_top_starter(){assert!(role_target_ovr(LeagueTier::Lower,SquadRole::Star)<role_target_ovr(LeagueTier::Top,SquadRole::Starter));}
