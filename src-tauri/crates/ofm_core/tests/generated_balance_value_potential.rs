use ofm_core::generated_balance::market_value_eur;
#[test]
fn potential_adds_market_value() {
    assert!(market_value_eur(65, 85, 19) > market_value_eur(65, 65, 19));
}
