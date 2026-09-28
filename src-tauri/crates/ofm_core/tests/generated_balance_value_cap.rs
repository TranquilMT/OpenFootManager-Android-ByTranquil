use ofm_core::generated_balance::market_value_eur;
#[test]
fn value_has_cap() {
    assert!(market_value_eur(99, 99, 23) <= 220_000_000);
}
