use ofm_core::generated_balance::market_value_eur;
#[test]
fn value_has_floor() {
    assert!(market_value_eur(30, 30, 35) >= 10_000);
}
