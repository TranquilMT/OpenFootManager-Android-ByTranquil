use ofm_core::generated_balance::market_value_eur;
#[test] fn age_changes_value_for_same_quality(){assert!(market_value_eur(78,82,23)>market_value_eur(78,82,34));}
