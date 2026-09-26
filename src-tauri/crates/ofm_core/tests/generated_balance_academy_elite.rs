use ofm_core::generated_balance::{potential_ceiling,LeagueTier};#[test]fn elite_academy_can_reach_world_class_potential(){assert!(potential_ceiling(LeagueTier::Elite,100)>=90);}
