use ofm_core::generated_balance::weekly_wage_eur;
#[test]
fn elite_quality_demands_higher_wage() {
    assert!(weekly_wage_eur(86, 90) > weekly_wage_eur(55, 40));
}
