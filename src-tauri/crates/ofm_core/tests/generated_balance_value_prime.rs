use ofm_core::generated_balance::market_value_eur;
#[test]
fn prime_more_valuable_than_veteran() {
    assert!(market_value_eur(74, 76, 27) > market_value_eur(74, 76, 36));
}
