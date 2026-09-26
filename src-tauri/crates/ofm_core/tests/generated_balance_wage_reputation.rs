use ofm_core::generated_balance::weekly_wage_eur;
#[test] fn reputation_increases_wage_at_same_ability(){assert!(weekly_wage_eur(75,90)>weekly_wage_eur(75,20));}
