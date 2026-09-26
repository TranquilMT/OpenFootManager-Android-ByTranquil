use ofm_core::generated_balance::{rating_band,LeagueTier};#[test]fn grassroots_ceiling_is_64(){assert_eq!(rating_band(LeagueTier::Grassroots).ceiling,64);}
