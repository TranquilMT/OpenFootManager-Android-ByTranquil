use ofm_core::generated_balance::{rating_band,LeagueTier};#[test]fn top_ceiling_below_elite(){assert!(rating_band(LeagueTier::Top).ceiling<rating_band(LeagueTier::Elite).ceiling);}
