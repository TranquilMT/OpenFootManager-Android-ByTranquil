use ofm_core::generated_balance::weekly_wage_eur;#[test]fn wage_has_cap(){assert!(weekly_wage_eur(99,100)<=450_000);}
