use ofm_core::generated_balance::{LeagueTier, rating_band};
#[test]
fn grassroots_can_drop_below_40() {
    assert!(rating_band(LeagueTier::Grassroots).floor < 40);
}
