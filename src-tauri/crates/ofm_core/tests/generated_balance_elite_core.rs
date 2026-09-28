use ofm_core::generated_balance::{LeagueTier, rating_band};
#[test]
fn elite_core_starts_in_70s() {
    assert!(rating_band(LeagueTier::Elite).core_low >= 70);
}
