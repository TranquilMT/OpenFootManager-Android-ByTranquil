use ofm_core::generated_balance::{LeagueTier, rating_band};
#[test]
fn top_core_below_elite() {
    assert!(rating_band(LeagueTier::Top).core_high < rating_band(LeagueTier::Elite).core_high);
}
