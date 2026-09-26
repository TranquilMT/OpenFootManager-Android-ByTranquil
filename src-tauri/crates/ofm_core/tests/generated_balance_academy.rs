use ofm_core::generated_balance::{potential_ceiling,LeagueTier};
#[test] fn academy_quality_raises_potential_ceiling(){assert!(potential_ceiling(LeagueTier::Top,100)>potential_ceiling(LeagueTier::Top,0));}
