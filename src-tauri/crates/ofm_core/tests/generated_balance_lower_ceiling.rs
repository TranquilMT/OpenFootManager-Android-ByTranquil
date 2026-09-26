use ofm_core::generated_balance::{rating_band,LeagueTier};#[test]fn lower_ceiling_is_72(){assert_eq!(rating_band(LeagueTier::Lower).ceiling,72);}
