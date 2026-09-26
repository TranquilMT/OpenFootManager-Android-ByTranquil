use ofm_core::generated_balance::{rating_band,LeagueTier};#[test]fn pro_ceiling_is_80(){assert_eq!(rating_band(LeagueTier::Professional).ceiling,80);}
