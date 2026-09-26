use ofm_core::generated_balance::market_value_eur;
#[test] fn elite_player_is_far_more_valuable_than_squad_player(){assert!(market_value_eur(85,88,25)>market_value_eur(58,65,25)*5);}
