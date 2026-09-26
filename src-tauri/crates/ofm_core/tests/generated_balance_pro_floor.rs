use ofm_core::generated_balance::{rating_band,LeagueTier};#[test]fn professional_floor(){assert_eq!(rating_band(LeagueTier::Professional).floor,45);}
