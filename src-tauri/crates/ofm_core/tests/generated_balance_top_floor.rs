use ofm_core::generated_balance::{rating_band,LeagueTier};#[test]fn top_floor(){assert_eq!(rating_band(LeagueTier::Top).floor,50);}
