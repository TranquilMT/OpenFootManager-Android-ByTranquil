use ofm_core::generated_balance::{LeagueTier, potential_ceiling};

#[test]
fn generated_potential_never_reaches_100() {
    assert_eq!(potential_ceiling(LeagueTier::Elite, 100), 96);
}
