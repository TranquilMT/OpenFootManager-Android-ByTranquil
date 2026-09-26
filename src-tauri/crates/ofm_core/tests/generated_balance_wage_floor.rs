use ofm_core::generated_balance::weekly_wage_eur;#[test]fn wage_has_floor(){assert!(weekly_wage_eur(30,0)>=150);}
