use ofm_core::generated_balance::{potential_ceiling, LeagueTier};

#[test]
fn generated_potential_never_reaches_100() {
    assert_eq!(potential_ceiling(LeagueTier::Elite, 100), 96);
}
