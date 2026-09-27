use ofm_core::generated_balance::{LeagueTier, rating_band};

#[test]
fn pro_ceiling_is_90() {
    assert_eq!(rating_band(LeagueTier::Professional).ceiling, 90);
}
