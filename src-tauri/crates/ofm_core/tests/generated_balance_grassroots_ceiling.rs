use ofm_core::generated_balance::{LeagueTier, rating_band};
#[test]
fn grassroots_ceiling_is_64() {
    assert_eq!(rating_band(LeagueTier::Grassroots).ceiling, 64);
}
