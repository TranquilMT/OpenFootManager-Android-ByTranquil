use ofm_core::generated_balance::{rating_band,LeagueTier};#[test]fn top_core_below_elite(){assert!(rating_band(LeagueTier::Top).core_high<rating_band(LeagueTier::Elite).core_high);}
