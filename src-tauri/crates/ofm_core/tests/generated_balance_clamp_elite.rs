use ofm_core::generated_balance::{clamp_generated_ovr,LeagueTier};#[test]fn elite_senior_underflow_clamps(){assert_eq!(clamp_generated_ovr(LeagueTier::Elite,10,false),55);}
